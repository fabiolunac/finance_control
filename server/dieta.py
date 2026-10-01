"""Rotas do módulo Dieta: bebidas cadastradas e consumo de cafeína.

Cada consumo guarda uma cópia do nome, dos ml e da cafeína (mg) no momento
em que foi registrado, pra que editar ou apagar uma bebida não mude o histórico.

Ao registrar uma bebida que faz o total do dia passar de 80% ou de 100% do
limite, manda uma notificação push (só na hora em que cruza, uma vez cada).
"""

from datetime import datetime, timedelta, timezone
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


LIMITE_CAFEINA_MG = 500  # o mesmo do dieta.js
MARCOS_AVISO = (0.8, 1.0)  # frações do limite que geram notificação


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


def texto_mg(mg):
    return f"{round(mg)} mg"


def aviso_cafeina(antes, depois):
    """(título, corpo) se o total cruzou um marco agora; senão None. Vale o marco mais alto cruzado."""
    cruzados = [m for m in MARCOS_AVISO if antes < m * LIMITE_CAFEINA_MG <= depois]
    if not cruzados:
        return None
    titulo = f"Cafeína: {texto_mg(depois)} hoje"
    if max(cruzados) >= 1:
        excesso = depois - LIMITE_CAFEINA_MG
        corpo = f"Passou do limite de {texto_mg(LIMITE_CAFEINA_MG)}" + (f" em {texto_mg(excesso)}." if excesso >= 1 else ".")
    else:
        corpo = (f"Chegou a {round(max(cruzados) * 100)}% do limite. "
                 f"Faltam {texto_mg(LIMITE_CAFEINA_MG - depois)} pra {texto_mg(LIMITE_CAFEINA_MG)}.")
    return titulo, corpo


def criar_rotas(conectar, checar_token, avisar=None):
    """conectar e checar_token vêm do main.py, pra não duplicar a conexão e o token.
    avisar(client, titulo, corpo) manda a notificação push; None desliga os avisos."""
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
        dia = consumo.DataHora[:10]
        with conectar() as client:
            garantir_tabelas(client)
            antes = client.execute(
                "SELECT COALESCE(SUM(Cafeina), 0) FROM consumo_cafeina WHERE substr(DataHora, 1, 10) = ?", [dia]
            ).rows[0][0]
            rs = client.execute(
                "INSERT INTO consumo_cafeina (DataHora, BebidaId, Bebida, Ml, Cafeina) VALUES (?, ?, ?, ?, ?)",
                [consumo.DataHora, consumo.BebidaId, consumo.Bebida.strip(), consumo.Ml, consumo.Cafeina],
            )
            # Só avisa de um dia que pode ser hoje (o servidor está em UTC, o app no fuso local)
            agora = datetime.now(timezone.utc).replace(tzinfo=None)
            pode_ser_hoje = abs(agora - datetime.fromisoformat(dia)) <= timedelta(days=1, hours=12)
            aviso = aviso_cafeina(antes, antes + consumo.Cafeina)
            if avisar and aviso and pode_ser_hoje:
                avisar(client, *aviso)
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
