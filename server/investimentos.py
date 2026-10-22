"""Rotas da aba Investimentos: aplicações que rendem um percentual do CDI.

Cada aplicação guarda o saldo conferido numa data (Saldo, Data) e as taxas:
Percentual do CDI até o Limite e PercentualAcima no que passar dele (ex.:
cofrinho a 120% até R$ 10 mil e 100% acima). Sem Limite, tudo rende o
Percentual. O app calcula o saldo de hoje com o CDI de cada dia útil
publicado pelo Banco Central depois da Data.

Pra estimar o imposto: AplicadoDesde (desde quando o dinheiro está lá, define
a alíquota do IR e o IOF) e RendimentoAnterior (rendimento já embutido no
Saldo, que também paga IR no resgate). Os dois são opcionais. SaldoLiquido
marca o banco que já mostra o saldo sem o IR (ex.: Mercado Pago): aí o app
soma o rendimento líquido e não desconta de novo.
"""

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

DATA_ISO = r"^\d{4}-\d{2}-\d{2}$"

TABELA = """CREATE TABLE IF NOT EXISTS aplicacoes (
    id INTEGER PRIMARY KEY, Nome TEXT NOT NULL, Saldo REAL NOT NULL,
    Data TEXT NOT NULL, Percentual REAL NOT NULL, Limite REAL,
    PercentualAcima REAL NOT NULL DEFAULT 100)"""

# Colunas que vieram depois: entram com ALTER
COLUNAS_NOVAS = {
    "AplicadoDesde": "TEXT",
    "RendimentoAnterior": "REAL NOT NULL DEFAULT 0",
    "SaldoLiquido": "INTEGER NOT NULL DEFAULT 0",
}


class NovaAplicacao(BaseModel):
    Nome: str = Field(min_length=1, max_length=60)
    Saldo: float = Field(ge=0)
    Data: str = Field(pattern=DATA_ISO)
    Percentual: float = Field(gt=0, le=300)
    Limite: Optional[float] = Field(default=None, gt=0)
    PercentualAcima: float = Field(default=100, ge=0, le=300)
    AplicadoDesde: Optional[str] = Field(default=None, pattern=DATA_ISO)
    RendimentoAnterior: float = Field(default=0, ge=0)
    SaldoLiquido: bool = False


def criar_rotas(conectar, checar_token):
    """conectar e checar_token vêm do main.py, pra não duplicar a conexão e o token."""
    rotas = APIRouter(prefix="/api/aplicacoes", dependencies=[Depends(checar_token)])
    tabela_pronta = False

    def garantir_tabela(client):
        nonlocal tabela_pronta
        if not tabela_pronta:
            client.execute(TABELA)
            colunas = [row[1] for row in client.execute("PRAGMA table_info(aplicacoes)").rows]
            for coluna, tipo in COLUNAS_NOVAS.items():
                if coluna not in colunas:
                    client.execute(f"ALTER TABLE aplicacoes ADD COLUMN {coluna} {tipo}")
            tabela_pronta = True

    def campos(aplicacao):
        return [aplicacao.Nome.strip(), aplicacao.Saldo, aplicacao.Data, aplicacao.Percentual,
                aplicacao.Limite, aplicacao.PercentualAcima, aplicacao.AplicadoDesde,
                aplicacao.RendimentoAnterior, int(aplicacao.SaldoLiquido)]

    @rotas.get("")
    def listar():
        with conectar() as client:
            garantir_tabela(client)
            rs = client.execute(
                "SELECT id, Nome, Saldo, Data, Percentual, Limite, PercentualAcima, AplicadoDesde,"
                " RendimentoAnterior, SaldoLiquido FROM aplicacoes ORDER BY Nome"
            )
        lista = [dict(zip(rs.columns, row)) for row in rs.rows]
        for aplicacao in lista:
            aplicacao["SaldoLiquido"] = bool(aplicacao["SaldoLiquido"])
        return {"aplicacoes": lista}

    @rotas.post("", status_code=201)
    def adicionar(aplicacao: NovaAplicacao):
        with conectar() as client:
            garantir_tabela(client)
            rs = client.execute(
                "INSERT INTO aplicacoes (Nome, Saldo, Data, Percentual, Limite, PercentualAcima, AplicadoDesde,"
                " RendimentoAnterior, SaldoLiquido) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                campos(aplicacao),
            )
        return {"ok": True, "id": rs.last_insert_rowid}

    @rotas.put("/{id}")
    def atualizar(id: int, aplicacao: NovaAplicacao):
        with conectar() as client:
            garantir_tabela(client)
            client.execute(
                "UPDATE aplicacoes SET Nome = ?, Saldo = ?, Data = ?, Percentual = ?, Limite = ?, PercentualAcima = ?,"
                " AplicadoDesde = ?, RendimentoAnterior = ?, SaldoLiquido = ? WHERE id = ?",
                [*campos(aplicacao), id],
            )
        return {"ok": True}

    @rotas.delete("/{id}", status_code=204)
    def remover(id: int):
        with conectar() as client:
            garantir_tabela(client)
            client.execute("DELETE FROM aplicacoes WHERE id = ?", [id])

    return rotas
