"""Rotas do módulo Combustível: abastecimentos.

Cada abastecimento guarda o km do parcial no momento de abastecer (antes de
zerar), ou seja, quanto o veículo rodou com o abastecimento anterior. O app
junta os dois pra calcular quanto cada abastecimento rendeu. Com o preço por
litro, sai também o consumo em km/l.
"""

from typing import Literal, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

COMBUSTIVEIS = Literal["Gasolina", "Gasolina aditivada", "Etanol", "Diesel", "GNV"]

TABELA = """CREATE TABLE IF NOT EXISTS abastecimentos (
    id INTEGER PRIMARY KEY, Data TEXT NOT NULL, Valor REAL NOT NULL,
    Km REAL NOT NULL, Combustivel TEXT NOT NULL, Veiculo TEXT NOT NULL,
    PrecoLitro REAL)"""


class NovoAbastecimento(BaseModel):
    Data: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    Valor: float = Field(gt=0)
    Km: float = Field(ge=0)  # parcial antes de zerar: km rodados desde o abastecimento anterior
    Combustivel: COMBUSTIVEIS
    Veiculo: str = Field(min_length=1, max_length=60)
    PrecoLitro: Optional[float] = Field(default=None, gt=0)  # ausente nos registros antigos


def criar_rotas(conectar, checar_token):
    """conectar e checar_token vêm do main.py, pra não duplicar a conexão e o token."""
    rotas = APIRouter(prefix="/api/abastecimentos", dependencies=[Depends(checar_token)])
    tabela_pronta = False

    def garantir_tabela(client):
        nonlocal tabela_pronta
        if not tabela_pronta:
            client.execute(TABELA)
            # Tabela criada antes do preço por litro existir: acrescenta a coluna
            colunas = [row[1] for row in client.execute("PRAGMA table_info(abastecimentos)").rows]
            if "PrecoLitro" not in colunas:
                client.execute("ALTER TABLE abastecimentos ADD COLUMN PrecoLitro REAL")
            tabela_pronta = True

    @rotas.get("")
    def listar():
        with conectar() as client:
            garantir_tabela(client)
            rs = client.execute(
                "SELECT id, Data, Valor, Km, Combustivel, Veiculo, PrecoLitro FROM abastecimentos ORDER BY Data DESC, id DESC"
            )
        return {"abastecimentos": [dict(zip(rs.columns, row)) for row in rs.rows]}

    @rotas.post("", status_code=201)
    def adicionar(abastecimento: NovoAbastecimento):
        with conectar() as client:
            garantir_tabela(client)
            rs = client.execute(
                "INSERT INTO abastecimentos (Data, Valor, Km, Combustivel, Veiculo, PrecoLitro) VALUES (?, ?, ?, ?, ?, ?)",
                [abastecimento.Data, abastecimento.Valor, abastecimento.Km,
                 abastecimento.Combustivel, abastecimento.Veiculo.strip(), abastecimento.PrecoLitro],
            )
        return {"ok": True, "id": rs.last_insert_rowid}

    @rotas.put("/{id}")
    def atualizar(id: int, abastecimento: NovoAbastecimento):
        with conectar() as client:
            garantir_tabela(client)
            client.execute(
                "UPDATE abastecimentos SET Data = ?, Valor = ?, Km = ?, Combustivel = ?, Veiculo = ?, PrecoLitro = ? WHERE id = ?",
                [abastecimento.Data, abastecimento.Valor, abastecimento.Km,
                 abastecimento.Combustivel, abastecimento.Veiculo.strip(), abastecimento.PrecoLitro, id],
            )
        return {"ok": True}

    @rotas.delete("/{id}", status_code=204)
    def remover(id: int):
        with conectar() as client:
            garantir_tabela(client)
            client.execute("DELETE FROM abastecimentos WHERE id = ?", [id])

    return rotas
