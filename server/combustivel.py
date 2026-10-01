"""Rotas do módulo Combustível: abastecimentos.

Cada abastecimento guarda o km do parcial no momento de abastecer (antes de
zerar), ou seja, quanto o veículo rodou com o abastecimento anterior. O app
junta os dois pra calcular quanto cada abastecimento rendeu. Com o preço por
litro, sai também o consumo em km/l.

O odômetro de cada veículo é uma leitura informada (Km, na Data) mais o
parcial de cada abastecimento registrado depois dela. Como o parcial do
abastecimento seguinte inclui o que já tinha sido rodado antes da leitura,
a leitura guarda também o parcial daquele momento, descontado uma vez.
UltimoId separa, no mesmo dia, o que veio antes e depois da leitura.
"""

from typing import Literal, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

COMBUSTIVEIS = Literal["Gasolina", "Gasolina aditivada", "Etanol", "Diesel", "GNV"]

TABELA = """CREATE TABLE IF NOT EXISTS abastecimentos (
    id INTEGER PRIMARY KEY, Data TEXT NOT NULL, Valor REAL NOT NULL,
    Km REAL NOT NULL, Combustivel TEXT NOT NULL, Veiculo TEXT NOT NULL,
    PrecoLitro REAL)"""


TABELA_ODOMETROS = """CREATE TABLE IF NOT EXISTS odometros (
    Veiculo TEXT PRIMARY KEY, Km REAL NOT NULL, Parcial REAL NOT NULL DEFAULT 0,
    Data TEXT NOT NULL, UltimoId INTEGER NOT NULL DEFAULT 0)"""

# Leituras informadas em 01/10/2026, gravadas só quando a tabela nasce.
# O nome do veículo é livre: casa por "carro" e "moto" no nome.
LEITURAS_INICIAIS = {"carro": 65751, "moto": 19732}
DATA_LEITURAS_INICIAIS = "2026-10-01"


class NovoAbastecimento(BaseModel):
    Data: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    Valor: float = Field(gt=0)
    Km: float = Field(ge=0)  # parcial antes de zerar: km rodados desde o abastecimento anterior
    Combustivel: COMBUSTIVEIS
    Veiculo: str = Field(min_length=1, max_length=60)
    PrecoLitro: Optional[float] = Field(default=None, gt=0)  # ausente nos registros antigos


class LeituraOdometro(BaseModel):
    Km: float = Field(ge=0)
    Parcial: float = Field(default=0, ge=0)  # parcial do painel na hora da leitura
    Data: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")


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
            existia = client.execute(
                "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'odometros'").rows
            client.execute(TABELA_ODOMETROS)
            if not existia:
                semear_odometros(client)
            tabela_pronta = True

    def semear_odometros(client):
        ultimo_id = client.execute("SELECT COALESCE(MAX(id), 0) FROM abastecimentos").rows[0][0]
        veiculos = [row[0] for row in client.execute("SELECT DISTINCT Veiculo FROM abastecimentos").rows]
        for veiculo in veiculos:
            km = next((v for chave, v in LEITURAS_INICIAIS.items() if chave in veiculo.lower()), None)
            if km is not None:
                client.execute(
                    "INSERT OR IGNORE INTO odometros (Veiculo, Km, Parcial, Data, UltimoId) VALUES (?, ?, 0, ?, ?)",
                    [veiculo, km, DATA_LEITURAS_INICIAIS, ultimo_id],
                )

    @rotas.get("")
    def listar():
        with conectar() as client:
            garantir_tabela(client)
            rs = client.execute(
                "SELECT id, Data, Valor, Km, Combustivel, Veiculo, PrecoLitro FROM abastecimentos ORDER BY Data DESC, id DESC"
            )
            odometros = client.execute("SELECT Veiculo, Km, Parcial, Data, UltimoId FROM odometros")
        return {
            "abastecimentos": [dict(zip(rs.columns, row)) for row in rs.rows],
            "odometros": [dict(zip(odometros.columns, row)) for row in odometros.rows],
        }

    # Nova leitura: o que já estava registrado até agora fica pra trás
    @rotas.put("/odometro/{veiculo}")
    def informar_odometro(veiculo: str, leitura: LeituraOdometro):
        with conectar() as client:
            garantir_tabela(client)
            ultimo_id = client.execute("SELECT COALESCE(MAX(id), 0) FROM abastecimentos").rows[0][0]
            client.execute(
                "INSERT OR REPLACE INTO odometros (Veiculo, Km, Parcial, Data, UltimoId) VALUES (?, ?, ?, ?, ?)",
                [veiculo.strip(), leitura.Km, leitura.Parcial, leitura.Data, ultimo_id],
            )
        return {"ok": True}

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
