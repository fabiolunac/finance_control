import os
from typing import Optional

import libsql_client
import pandas as pd
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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


def obter_cliente():
    return libsql_client.create_client_sync(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)


def checar_token(request: Request):
    auth = request.headers.get("authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    if token != API_TOKEN:
        raise HTTPException(status_code=401, detail="Token inválido ou ausente.")


def carregar_dataframes():
    client = obter_cliente()
    try:
        gastos_rs = client.execute(
            "SELECT rowid, Data, Local, Valor, banco, tipo FROM gastos ORDER BY Data ASC, rowid ASC"
        )
        param_rs = client.execute('SELECT Local, Categoria, "Categoria Geral" FROM param')
    finally:
        client.close()

    df = pd.DataFrame(gastos_rs.rows, columns=gastos_rs.columns)
    df["Valor"] = pd.to_numeric(df["Valor"], errors="coerce").fillna(0.0)
    df_param = pd.DataFrame(param_rs.rows, columns=param_rs.columns)
    return df, df_param


def mes_atual():
    return pd.Timestamp.today().strftime("%Y-%m")


class NovoGasto(BaseModel):
    Data: str
    Local: str
    Valor: float


@app.get("/api/gastos")
def listar_gastos(mes: Optional[str] = None, todos: Optional[str] = None, _=Depends(checar_token)):
    df, df_param = carregar_dataframes()

    if df.empty:
        return {"mes": mes_atual(), "total": 0, "gastos": []}

    df = prepare_data(df, df_param)

    ver_tudo = todos == "1"
    mes_selecionado = mes if mes and len(mes) == 7 else mes_atual()

    if ver_tudo:
        df_filtrado = df
    else:
        df_filtrado = df[df["Data"].dt.strftime("%Y-%m") == mes_selecionado]

    total = df_filtrado.loc[df_filtrado["Pagamento?"] == "Não", "Valor"].sum()

    df_ordenado = df_filtrado.sort_values(["Data", "rowid"], ascending=False).copy()
    df_ordenado["Data"] = df_ordenado["Data"].dt.strftime("%Y-%m-%d %H:%M:%S")
    df_ordenado["Mês Pagamento"] = df_ordenado["Mês Pagamento"].astype(str)
    df_ordenado["rowid"] = df_ordenado["rowid"].astype(int)
    df_ordenado["Ano Pagamento"] = df_ordenado["Ano Pagamento"].astype(int)
    df_ordenado["Valor"] = df_ordenado["Valor"].astype(float)
    df_ordenado["Saldo"] = df_ordenado["Saldo"].astype(float)

    return {
        "mes": None if ver_tudo else mes_selecionado,
        "total": float(total),
        "gastos": df_ordenado.to_dict(orient="records"),
    }


@app.post("/api/gastos", status_code=201)
def adicionar_gasto(gasto: NovoGasto, _=Depends(checar_token)):
    client = obter_cliente()
    try:
        client.execute(
            "INSERT INTO gastos (Data, Local, Valor) VALUES (?, ?, ?)",
            [f"{gasto.Data} 00:00:00", gasto.Local, gasto.Valor],
        )
    finally:
        client.close()

    return {"ok": True}


@app.delete("/api/gastos/{rowid}")
def excluir_gasto(rowid: int, _=Depends(checar_token)):
    client = obter_cliente()
    try:
        client.execute("DELETE FROM gastos WHERE rowid = ?", [rowid])
    finally:
        client.close()

    return {"ok": True}
