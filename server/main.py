import os

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
    df["Mês Pagamento"] = df["Mês Pagamento"].astype(str)

    return {"gastos": df.to_dict(orient="records")}


class NovoGasto(BaseModel):
    Data: str
    Local: str
    Valor: float
    tipo: str = "Gasto"
    banco: str = "yuh"


@app.post("/api/gastos", status_code=201)
def adicionar_gasto(gasto: NovoGasto, _=Depends(checar_token)):
    client = libsql_client.create_client_sync(url=TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
    try:
        client.execute(
            "INSERT INTO gastos (Data, Local, Valor, banco, tipo) VALUES (?, ?, ?, ?, ?)",
            [f"{gasto.Data} 00:00:00", gasto.Local, gasto.Valor, gasto.banco, gasto.tipo],
        )
    finally:
        client.close()

    return {"ok": True}


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
