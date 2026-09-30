import json
import os
from contextlib import contextmanager
from typing import List, Literal, Optional

import libsql_client
import pandas as pd
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from transform_db import prepare_data

load_dotenv()


def _forcar_http(url: str) -> str:
    # O esquema libsql:// usa WebSocket (wss://), que falha em alguns hosts
    # (ex: Render). https:// usa o mesmo protocolo Hrana só que sobre HTTP puro.
    if url.startswith("libsql://"):
        return "https://" + url[len("libsql://"):]
    return url


TURSO_DATABASE_URL = _forcar_http(os.environ["TURSO_DATABASE_URL"])
TURSO_AUTH_TOKEN = os.environ.get("TURSO_AUTH_TOKEN")
API_TOKEN = os.environ["API_TOKEN"]
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


def checar_token(request: Request):
    auth = request.headers.get("authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    if token != API_TOKEN:
        raise HTTPException(status_code=401, detail="Token inválido ou ausente.")


@app.get("/api/gastos")
def listar_gastos(_=Depends(checar_token)):
    client = libsql_client.create_client_sync(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
    try:
        gastos_rs = client.execute(
            "SELECT rowid, Data, Local, Valor, banco, tipo FROM gastos ORDER BY Data ASC, rowid ASC"
        )
        param_rs = client.execute('SELECT Local, Categoria, "Categoria Geral" FROM param')
    finally:
        client.close()

    df = pd.DataFrame(gastos_rs.rows, columns=gastos_rs.columns)
    if df.empty:
        return {"gastos": []}

    df["Valor"] = pd.to_numeric(df["Valor"], errors="coerce").fillna(0.0)
    df_param = pd.DataFrame(param_rs.rows, columns=param_rs.columns)

    df = prepare_data(df, df_param)

    df = df.sort_values(["Data", "rowid"], ascending=False)
    df["Data"] = df["Data"].dt.strftime("%Y-%m-%d")

    return {"gastos": df.to_dict(orient="records")}


class NovoGasto(BaseModel):
    Data: str
    Local: str
    Valor: float
    tipo: str = "Gasto"
    banco: str


@app.post("/api/gastos", status_code=201)
def adicionar_gasto(gasto: NovoGasto, _=Depends(checar_token)):
    client = libsql_client.create_client_sync(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
    try:
        rs = client.execute(
            "INSERT INTO gastos (Data, Local, Valor, banco, tipo) VALUES (?, ?, ?, ?, ?)",
            [f"{gasto.Data} 00:00:00", gasto.Local, gasto.Valor, gasto.banco, gasto.tipo],
        )
    finally:
        client.close()

    # rowid do gasto criado, pro app poder abrir ele pra edição logo em seguida
    return {"ok": True, "rowid": rs.last_insert_rowid}


@app.delete("/api/gastos/{rowid}", status_code=204)
def remover_gasto(rowid: int, _=Depends(checar_token)):
    client = libsql_client.create_client_sync(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
    try:
        client.execute("DELETE FROM gastos WHERE rowid = ?", [rowid])
    finally:
        client.close()


@app.put("/api/gastos/{rowid}")
def atualizar_gasto(rowid: int, gasto: NovoGasto, _=Depends(checar_token)):
    client = libsql_client.create_client_sync(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
    try:
        client.execute(
            "UPDATE gastos SET Data = ?, Local = ?, Valor = ?, banco = ?, tipo = ? WHERE rowid = ?",
            [f"{gasto.Data} 00:00:00", gasto.Local, gasto.Valor, gasto.banco, gasto.tipo, rowid],
        )
    finally:
        client.close()

    return {"ok": True}


@app.get("/api/param")
def listar_param(_=Depends(checar_token)):
    client = libsql_client.create_client_sync(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
    try:
        rs = client.execute(
            'SELECT rowid, Local, Categoria, "Categoria Geral" FROM param ORDER BY Local ASC'
        )
    finally:
        client.close()

    return {"param": [dict(zip(rs.columns, row)) for row in rs.rows]}


class NovoParam(BaseModel):
    Local: str
    Categoria: str
    CategoriaGeral: str


@app.post("/api/param", status_code=201)
def adicionar_param(param: NovoParam, _=Depends(checar_token)):
    client = libsql_client.create_client_sync(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
    try:
        client.execute(
            'INSERT INTO param (Local, Categoria, "Categoria Geral") VALUES (?, ?, ?)',
            [param.Local, param.Categoria, param.CategoriaGeral],
        )
    finally:
        client.close()

    return {"ok": True}


@app.put("/api/param/{rowid}")
def atualizar_param(rowid: int, param: NovoParam, _=Depends(checar_token)):
    client = libsql_client.create_client_sync(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
    try:
        client.execute(
            'UPDATE param SET Local = ?, Categoria = ?, "Categoria Geral" = ? WHERE rowid = ?',
            [param.Local, param.Categoria, param.CategoriaGeral, rowid],
        )
    finally:
        client.close()

    return {"ok": True}


@app.delete("/api/param/{rowid}", status_code=204)
def remover_param(rowid: int, _=Depends(checar_token)):
    client = libsql_client.create_client_sync(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
    try:
        client.execute("DELETE FROM param WHERE rowid = ?", [rowid])
    finally:
        client.close()


# ---------- Fatura do cartão: cartões, compras parceladas e faturas pagas ----------


@contextmanager
def conectar():
    client = libsql_client.create_client_sync(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
    try:
        yield client
    finally:
        client.close()


# As tabelas da fatura são criadas na primeira vez que alguma rota dela é usada,
# pra não precisar mexer no Turso à mão. "id INTEGER PRIMARY KEY" é estável
# (diferente do rowid implícito, que pode mudar num VACUUM).
TABELAS_FATURA = [
    """CREATE TABLE IF NOT EXISTS cartoes (
        id INTEGER PRIMARY KEY, Nome TEXT NOT NULL,
        Fechamento INTEGER NOT NULL, Vencimento INTEGER NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS compras_cartao (
        id INTEGER PRIMARY KEY, Data TEXT NOT NULL, Descricao TEXT NOT NULL,
        Valor REAL NOT NULL, Parcelas INTEGER NOT NULL, Cartao INTEGER NOT NULL,
        Divisao TEXT)""",
    """CREATE TABLE IF NOT EXISTS faturas_pagas (
        id INTEGER PRIMARY KEY, Cartao INTEGER NOT NULL, Mes TEXT NOT NULL,
        Valor REAL NOT NULL, Data TEXT NOT NULL, GastoRowid INTEGER)""",
]
_tabelas_fatura_prontas = False


def garantir_tabelas_fatura(client):
    global _tabelas_fatura_prontas
    if not _tabelas_fatura_prontas:
        client.batch(TABELAS_FATURA)
        # Tabela criada antes da divisão existir: acrescenta a coluna
        colunas = [row[1] for row in client.execute("PRAGMA table_info(compras_cartao)").rows]
        if "Divisao" not in colunas:
            client.execute("ALTER TABLE compras_cartao ADD COLUMN Divisao TEXT")
        _tabelas_fatura_prontas = True


def linhas(rs):
    return [dict(zip(rs.columns, row)) for row in rs.rows]


DATA_ISO = r"^\d{4}-\d{2}-\d{2}$"
MES_ISO = r"^\d{4}-\d{2}$"


class NovoCartao(BaseModel):
    Nome: str = Field(min_length=1, max_length=60)
    Fechamento: int = Field(ge=1, le=31)  # compras a partir deste dia vão pra fatura seguinte
    Vencimento: int = Field(ge=1, le=31)


class DivisaoCompra(BaseModel):
    # "dividida": partes iguais entre você e as pessoas; "outra": a compra é toda da pessoa
    tipo: Literal["dividida", "outra"]
    pessoas: List[str] = Field(min_length=1, max_length=10)


class NovaCompra(BaseModel):
    Data: str = Field(pattern=DATA_ISO)
    Descricao: str = Field(min_length=1, max_length=120)
    Valor: float = Field(gt=0)  # valor total; o app divide pelas parcelas
    Parcelas: int = Field(ge=1, le=48)
    Cartao: int
    Divisao: Optional[DivisaoCompra] = None  # ausente = compra só sua


def divisao_para_texto(divisao):
    if divisao is None:
        return None
    pessoas = [p.strip() for p in divisao.pessoas if p.strip()]
    return json.dumps({"tipo": divisao.tipo, "pessoas": pessoas}, ensure_ascii=False) if pessoas else None


class PagarFatura(BaseModel):
    Cartao: int
    Mes: str = Field(pattern=MES_ISO)  # mês de vencimento da fatura
    Valor: float = Field(gt=0)
    Data: str = Field(pattern=DATA_ISO)
    banco: str = Field(min_length=1)


@app.get("/api/fatura")
def listar_fatura(_=Depends(checar_token)):
    with conectar() as client:
        garantir_tabelas_fatura(client)
        cartoes, compras, pagas = client.batch([
            "SELECT id, Nome, Fechamento, Vencimento FROM cartoes ORDER BY Nome",
            "SELECT id, Data, Descricao, Valor, Parcelas, Cartao, Divisao FROM compras_cartao ORDER BY Data DESC, id DESC",
            "SELECT id, Cartao, Mes, Valor, Data, GastoRowid FROM faturas_pagas",
        ])
    lista_compras = linhas(compras)
    for compra in lista_compras:
        compra["Divisao"] = json.loads(compra["Divisao"]) if compra["Divisao"] else None
    return {"cartoes": linhas(cartoes), "compras": lista_compras, "pagas": linhas(pagas)}


@app.post("/api/cartoes", status_code=201)
def adicionar_cartao(cartao: NovoCartao, _=Depends(checar_token)):
    with conectar() as client:
        garantir_tabelas_fatura(client)
        rs = client.execute(
            "INSERT INTO cartoes (Nome, Fechamento, Vencimento) VALUES (?, ?, ?)",
            [cartao.Nome.strip(), cartao.Fechamento, cartao.Vencimento],
        )
    return {"ok": True, "id": rs.last_insert_rowid}


@app.put("/api/cartoes/{id}")
def atualizar_cartao(id: int, cartao: NovoCartao, _=Depends(checar_token)):
    with conectar() as client:
        garantir_tabelas_fatura(client)
        client.execute(
            "UPDATE cartoes SET Nome = ?, Fechamento = ?, Vencimento = ? WHERE id = ?",
            [cartao.Nome.strip(), cartao.Fechamento, cartao.Vencimento, id],
        )
    return {"ok": True}


@app.delete("/api/cartoes/{id}", status_code=204)
def remover_cartao(id: int, _=Depends(checar_token)):
    with conectar() as client:
        garantir_tabelas_fatura(client)
        rs = client.execute("SELECT COUNT(*) FROM compras_cartao WHERE Cartao = ?", [id])
        if rs.rows[0][0] > 0:
            raise HTTPException(status_code=409, detail="O cartão tem compras; remova-as antes.")
        client.execute("DELETE FROM cartoes WHERE id = ?", [id])


@app.post("/api/compras", status_code=201)
def adicionar_compra(compra: NovaCompra, _=Depends(checar_token)):
    with conectar() as client:
        garantir_tabelas_fatura(client)
        rs = client.execute(
            "INSERT INTO compras_cartao (Data, Descricao, Valor, Parcelas, Cartao, Divisao) VALUES (?, ?, ?, ?, ?, ?)",
            [compra.Data, compra.Descricao.strip(), compra.Valor, compra.Parcelas, compra.Cartao,
             divisao_para_texto(compra.Divisao)],
        )
    return {"ok": True, "id": rs.last_insert_rowid}


@app.put("/api/compras/{id}")
def atualizar_compra(id: int, compra: NovaCompra, _=Depends(checar_token)):
    with conectar() as client:
        garantir_tabelas_fatura(client)
        client.execute(
            "UPDATE compras_cartao SET Data = ?, Descricao = ?, Valor = ?, Parcelas = ?, Cartao = ?, Divisao = ? WHERE id = ?",
            [compra.Data, compra.Descricao.strip(), compra.Valor, compra.Parcelas, compra.Cartao,
             divisao_para_texto(compra.Divisao), id],
        )
    return {"ok": True}


@app.delete("/api/compras/{id}", status_code=204)
def remover_compra(id: int, _=Depends(checar_token)):
    with conectar() as client:
        garantir_tabelas_fatura(client)
        client.execute("DELETE FROM compras_cartao WHERE id = ?", [id])


@app.post("/api/faturas/pagar", status_code=201)
def pagar_fatura(pagamento: PagarFatura, _=Depends(checar_token)):
    """Lança o gasto "Fatura <cartão>" e marca a fatura do mês como paga, juntos."""
    with conectar() as client:
        garantir_tabelas_fatura(client)
        rs = client.execute("SELECT Nome FROM cartoes WHERE id = ?", [pagamento.Cartao])
        if not rs.rows:
            raise HTTPException(status_code=404, detail="Cartão não encontrado.")
        nome = rs.rows[0][0]

        ja_paga = client.execute(
            "SELECT 1 FROM faturas_pagas WHERE Cartao = ? AND Mes = ?", [pagamento.Cartao, pagamento.Mes]
        )
        if ja_paga.rows:
            raise HTTPException(status_code=409, detail="Essa fatura já está marcada como paga.")

        # batch roda em transação; last_insert_rowid() pega o gasto recém-criado
        client.batch([
            (
                "INSERT INTO gastos (Data, Local, Valor, banco, tipo) VALUES (?, ?, ?, ?, 'Gasto')",
                [f"{pagamento.Data} 00:00:00", f"Fatura {nome}", pagamento.Valor, pagamento.banco],
            ),
            (
                "INSERT INTO faturas_pagas (Cartao, Mes, Valor, Data, GastoRowid) VALUES (?, ?, ?, ?, last_insert_rowid())",
                [pagamento.Cartao, pagamento.Mes, pagamento.Valor, pagamento.Data],
            ),
        ])
    return {"ok": True}


@app.delete("/api/faturas/pagas/{id}", status_code=204)
def desfazer_pagamento(id: int, _=Depends(checar_token)):
    """Desmarca a fatura e apaga o gasto que foi lançado ao pagar."""
    with conectar() as client:
        garantir_tabelas_fatura(client)
        rs = client.execute("SELECT GastoRowid FROM faturas_pagas WHERE id = ?", [id])
        if not rs.rows:
            return
        gasto_rowid = rs.rows[0][0]
        client.batch([
            ("DELETE FROM gastos WHERE rowid = ?", [gasto_rowid]),
            ("DELETE FROM faturas_pagas WHERE id = ?", [id]),
        ])
