"""Rotas do módulo Dieta: bebidas cadastradas e consumo de cafeína.

Cada consumo guarda uma cópia do nome, dos ml e da cafeína (mg) no momento
em que foi registrado, pra que editar ou apagar uma bebida não mude o histórico.
"""

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

TABELAS = [
    """CREATE TABLE IF NOT EXISTS bebidas (
        id INTEGER PRIMARY KEY, Nome TEXT NOT NULL,
        Ml REAL NOT NULL, CafeinaPorMl REAL NOT NULL)""",
    """CREATE TABLE IF NOT EXISTS consumo_cafeina (
        id INTEGER PRIMARY KEY, DataHora TEXT NOT NULL, BebidaId INTEGER,
        Bebida TEXT NOT NULL, Ml REAL NOT NULL, Cafeina REAL NOT NULL)""",
]


class NovaBebida(BaseModel):
    Nome: str = Field(min_length=1, max_length=60)
    Ml: float = Field(gt=0)  # tamanho de uma unidade (lata, xícara...)
    CafeinaPorMl: float = Field(ge=0)  # mg de cafeína por ml


class NovoConsumo(BaseModel):
    DataHora: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$")  # hora local, como no input
    BebidaId: Optional[int] = None
    Bebida: str = Field(min_length=1, max_length=60)
    Ml: float = Field(gt=0)
    Cafeina: float = Field(ge=0)  # mg no total deste consumo


def criar_rotas(conectar, checar_token):
    """conectar e checar_token vêm do main.py, pra não duplicar a conexão e o token."""
    rotas = APIRouter(dependencies=[Depends(checar_token)])
    tabelas_prontas = False

    def garantir_tabelas(client):
        nonlocal tabelas_prontas
        if not tabelas_prontas:
            client.batch(TABELAS)
            tabelas_prontas = True

    def linhas(rs):
        return [dict(zip(rs.columns, row)) for row in rs.rows]

    # ----- Bebidas

    @rotas.get("/api/bebidas")
    def listar_bebidas():
        with conectar() as client:
            garantir_tabelas(client)
            rs = client.execute("SELECT id, Nome, Ml, CafeinaPorMl FROM bebidas ORDER BY Nome")
        return {"bebidas": linhas(rs)}

    @rotas.post("/api/bebidas", status_code=201)
    def adicionar_bebida(bebida: NovaBebida):
        with conectar() as client:
            garantir_tabelas(client)
            rs = client.execute(
                "INSERT INTO bebidas (Nome, Ml, CafeinaPorMl) VALUES (?, ?, ?)",
                [bebida.Nome.strip(), bebida.Ml, bebida.CafeinaPorMl],
            )
        return {"ok": True, "id": rs.last_insert_rowid}

    @rotas.put("/api/bebidas/{id}")
    def atualizar_bebida(id: int, bebida: NovaBebida):
        with conectar() as client:
            garantir_tabelas(client)
            client.execute(
                "UPDATE bebidas SET Nome = ?, Ml = ?, CafeinaPorMl = ? WHERE id = ?",
                [bebida.Nome.strip(), bebida.Ml, bebida.CafeinaPorMl, id],
            )
        return {"ok": True}

    @rotas.delete("/api/bebidas/{id}", status_code=204)
    def remover_bebida(id: int):
        # Os consumos ficam: guardam a cópia do nome e da cafeína
        with conectar() as client:
            garantir_tabelas(client)
            client.execute("DELETE FROM bebidas WHERE id = ?", [id])

    # ----- Consumo de cafeína

    @rotas.get("/api/cafeina")
    def listar_consumos():
        with conectar() as client:
            garantir_tabelas(client)
            rs = client.execute(
                "SELECT id, DataHora, BebidaId, Bebida, Ml, Cafeina FROM consumo_cafeina ORDER BY DataHora DESC, id DESC"
            )
        return {"consumos": linhas(rs)}

    @rotas.post("/api/cafeina", status_code=201)
    def adicionar_consumo(consumo: NovoConsumo):
        with conectar() as client:
            garantir_tabelas(client)
            rs = client.execute(
                "INSERT INTO consumo_cafeina (DataHora, BebidaId, Bebida, Ml, Cafeina) VALUES (?, ?, ?, ?, ?)",
                [consumo.DataHora, consumo.BebidaId, consumo.Bebida.strip(), consumo.Ml, consumo.Cafeina],
            )
        return {"ok": True, "id": rs.last_insert_rowid}

    @rotas.put("/api/cafeina/{id}")
    def atualizar_consumo(id: int, consumo: NovoConsumo):
        with conectar() as client:
            garantir_tabelas(client)
            client.execute(
                "UPDATE consumo_cafeina SET DataHora = ?, BebidaId = ?, Bebida = ?, Ml = ?, Cafeina = ? WHERE id = ?",
                [consumo.DataHora, consumo.BebidaId, consumo.Bebida.strip(), consumo.Ml, consumo.Cafeina, id],
            )
        return {"ok": True}

    @rotas.delete("/api/cafeina/{id}", status_code=204)
    def remover_consumo(id: int):
        with conectar() as client:
            garantir_tabelas(client)
            client.execute("DELETE FROM consumo_cafeina WHERE id = ?", [id])

    return rotas
