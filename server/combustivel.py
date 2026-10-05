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

Com Banco preenchido, o abastecimento também vira um gasto em Finanças
("Combustível <veículo>"), ligado por GastoRowid: editar ou excluir um
mexe no outro. Sem Banco, nada é lançado (ex.: pago no cartão de crédito,
que já entra pela fatura).

Manutenções (troca de óleo etc.) guardam o intervalo em km, em meses ou
nos dois, e o odômetro e a data da última vez que foram feitas. Vence pelo
que chegar primeiro; quanto falta o app calcula com o odômetro e o dia de hoje.
"""

from typing import Literal, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, model_validator

COMBUSTIVEIS = Literal["Gasolina", "Gasolina aditivada", "Etanol", "Diesel", "GNV"]

TABELA = """CREATE TABLE IF NOT EXISTS abastecimentos (
    id INTEGER PRIMARY KEY, Data TEXT NOT NULL, Valor REAL NOT NULL,
    Km REAL NOT NULL, Combustivel TEXT NOT NULL, Veiculo TEXT NOT NULL,
    PrecoLitro REAL)"""


TABELA_ODOMETROS = """CREATE TABLE IF NOT EXISTS odometros (
    Veiculo TEXT PRIMARY KEY, Km REAL NOT NULL, Parcial REAL NOT NULL DEFAULT 0,
    Data TEXT NOT NULL, UltimoId INTEGER NOT NULL DEFAULT 0)"""

# Leituras informadas em 01/10/2026 (Mobi é o carro, CG a moto), gravadas
# só enquanto a tabela estiver vazia. O nome do veículo é livre: casa por pedaço do nome.
LEITURAS_INICIAIS = {"mobi": 65751, "cg": 19732}
DATA_LEITURAS_INICIAIS = "2026-10-01"


TABELA_MANUTENCOES = """CREATE TABLE IF NOT EXISTS manutencoes (
    id INTEGER PRIMARY KEY, Veiculo TEXT NOT NULL, Nome TEXT NOT NULL,
    IntervaloKm REAL, UltimaKm REAL, IntervaloMeses INTEGER, UltimaData TEXT)"""

# Categoria do gasto lançado: a que já existir com "combust" no nome, senão esta
CATEGORIA_PADRAO = ("Combustível", "Transporte")


class NovoAbastecimento(BaseModel):
    Data: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    Valor: float = Field(gt=0)
    Km: float = Field(ge=0)  # parcial antes de zerar: km rodados desde o abastecimento anterior
    Combustivel: COMBUSTIVEIS
    Veiculo: str = Field(min_length=1, max_length=60)
    PrecoLitro: Optional[float] = Field(default=None, gt=0)  # ausente nos registros antigos
    Banco: Optional[str] = Field(default=None, max_length=60)  # preenchido: lança o gasto em Finanças


class LeituraOdometro(BaseModel):
    Km: float = Field(ge=0)
    Parcial: float = Field(default=0, ge=0)  # parcial do painel na hora da leitura
    Data: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")


class NovaManutencao(BaseModel):
    Veiculo: str = Field(min_length=1, max_length=60)
    Nome: str = Field(min_length=1, max_length=60)
    IntervaloKm: Optional[float] = Field(default=None, gt=0)
    UltimaKm: Optional[float] = Field(default=None, ge=0)  # odômetro da última vez que foi feita
    IntervaloMeses: Optional[int] = Field(default=None, gt=0, le=240)
    UltimaData: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")

    # Precisa de pelo menos um prazo, e cada prazo do seu ponto de partida
    @model_validator(mode="after")
    def prazos_completos(self):
        if self.IntervaloKm is None and self.IntervaloMeses is None:
            raise ValueError("informe o intervalo em km, em meses ou nos dois")
        if self.IntervaloKm is not None and self.UltimaKm is None:
            raise ValueError("intervalo em km sem o odômetro da última vez")
        if self.IntervaloMeses is not None and self.UltimaData is None:
            raise ValueError("intervalo em meses sem a data da última vez")
        return self


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
            if "GastoRowid" not in colunas:
                client.execute("ALTER TABLE abastecimentos ADD COLUMN GastoRowid INTEGER")
            client.execute(TABELA_MANUTENCOES)
            migrar_manutencoes(client)
            client.execute(TABELA_ODOMETROS)
            if not client.execute("SELECT 1 FROM odometros LIMIT 1").rows:
                semear_odometros(client)
            tabela_pronta = True

    def migrar_manutencoes(client):
        """Tabela de antes do prazo em meses: km era obrigatório. SQLite não
        tira NOT NULL com ALTER, então recria a tabela e copia as linhas."""
        colunas = [row[1] for row in client.execute("PRAGMA table_info(manutencoes)").rows]
        if "IntervaloMeses" in colunas:
            return
        client.batch([
            TABELA_MANUTENCOES.replace("manutencoes", "manutencoes_nova", 1),
            "INSERT INTO manutencoes_nova (id, Veiculo, Nome, IntervaloKm, UltimaKm) "
            "SELECT id, Veiculo, Nome, IntervaloKm, UltimaKm FROM manutencoes",
            "DROP TABLE manutencoes",
            "ALTER TABLE manutencoes_nova RENAME TO manutencoes",
        ])

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

    # ---------- Gasto ligado em Finanças ----------

    def categoria_do_local(client, local):
        """Cadastra o local na param, se ainda não estiver, pro gasto não cair em "Extra"."""
        if client.execute("SELECT 1 FROM param WHERE Local = ?", [local]).rows:
            return
        existente = client.execute(
            'SELECT Categoria, "Categoria Geral" FROM param WHERE Categoria LIKE ? LIMIT 1', ["%combust%"]
        ).rows
        categoria, geral = existente[0] if existente else CATEGORIA_PADRAO
        client.execute('INSERT INTO param (Local, Categoria, "Categoria Geral") VALUES (?, ?, ?)',
                       [local, categoria, geral])

    def gravar_gasto(client, abastecimento, gasto_rowid):
        """Cria, atualiza ou apaga o gasto conforme o Banco. Devolve o rowid que fica ligado."""
        banco = (abastecimento.Banco or "").strip()
        if not banco:
            if gasto_rowid:
                client.execute("DELETE FROM gastos WHERE rowid = ?", [gasto_rowid])
            return None
        local = f"Combustível {abastecimento.Veiculo.strip()}"
        categoria_do_local(client, local)
        valores = [f"{abastecimento.Data} 00:00:00", local, abastecimento.Valor, banco]
        if gasto_rowid and client.execute("SELECT 1 FROM gastos WHERE rowid = ?", [gasto_rowid]).rows:
            client.execute("UPDATE gastos SET Data = ?, Local = ?, Valor = ?, banco = ? WHERE rowid = ?",
                           valores + [gasto_rowid])
            return gasto_rowid
        rs = client.execute(
            "INSERT INTO gastos (Data, Local, Valor, banco, tipo) VALUES (?, ?, ?, ?, 'Gasto')", valores)
        return rs.last_insert_rowid

    # ---------- Abastecimentos ----------

    @rotas.get("")
    def listar():
        with conectar() as client:
            garantir_tabela(client)
            rs = client.execute(
                "SELECT a.id, a.Data, a.Valor, a.Km, a.Combustivel, a.Veiculo, a.PrecoLitro, a.GastoRowid, "
                "g.banco AS Banco FROM abastecimentos a LEFT JOIN gastos g ON g.rowid = a.GastoRowid "
                "ORDER BY a.Data DESC, a.id DESC"
            )
            odometros = client.execute("SELECT Veiculo, Km, Parcial, Data, UltimoId FROM odometros")
            manutencoes = client.execute(
                "SELECT id, Veiculo, Nome, IntervaloKm, UltimaKm, IntervaloMeses, UltimaData "
                "FROM manutencoes ORDER BY Nome")
        return {
            "abastecimentos": [dict(zip(rs.columns, row)) for row in rs.rows],
            "odometros": [dict(zip(odometros.columns, row)) for row in odometros.rows],
            "manutencoes": [dict(zip(manutencoes.columns, row)) for row in manutencoes.rows],
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
            gasto_rowid = gravar_gasto(client, abastecimento, None)
            rs = client.execute(
                "INSERT INTO abastecimentos (Data, Valor, Km, Combustivel, Veiculo, PrecoLitro, GastoRowid) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                [abastecimento.Data, abastecimento.Valor, abastecimento.Km,
                 abastecimento.Combustivel, abastecimento.Veiculo.strip(), abastecimento.PrecoLitro, gasto_rowid],
            )
        return {"ok": True, "id": rs.last_insert_rowid}

    @rotas.put("/{id}")
    def atualizar(id: int, abastecimento: NovoAbastecimento):
        with conectar() as client:
            garantir_tabela(client)
            atual = client.execute("SELECT GastoRowid FROM abastecimentos WHERE id = ?", [id]).rows
            gasto_rowid = gravar_gasto(client, abastecimento, atual[0][0] if atual else None)
            client.execute(
                "UPDATE abastecimentos SET Data = ?, Valor = ?, Km = ?, Combustivel = ?, Veiculo = ?, "
                "PrecoLitro = ?, GastoRowid = ? WHERE id = ?",
                [abastecimento.Data, abastecimento.Valor, abastecimento.Km, abastecimento.Combustivel,
                 abastecimento.Veiculo.strip(), abastecimento.PrecoLitro, gasto_rowid, id],
            )
        return {"ok": True}

    @rotas.delete("/{id}", status_code=204)
    def remover(id: int):
        with conectar() as client:
            garantir_tabela(client)
            atual = client.execute("SELECT GastoRowid FROM abastecimentos WHERE id = ?", [id]).rows
            if atual and atual[0][0]:
                client.execute("DELETE FROM gastos WHERE rowid = ?", [atual[0][0]])
            client.execute("DELETE FROM abastecimentos WHERE id = ?", [id])

    # ---------- Manutenções ----------

    @rotas.post("/manutencoes", status_code=201)
    def adicionar_manutencao(manutencao: NovaManutencao):
        with conectar() as client:
            garantir_tabela(client)
            rs = client.execute(
                "INSERT INTO manutencoes (Veiculo, Nome, IntervaloKm, UltimaKm, IntervaloMeses, UltimaData) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                [manutencao.Veiculo.strip(), manutencao.Nome.strip(), manutencao.IntervaloKm, manutencao.UltimaKm,
                 manutencao.IntervaloMeses, manutencao.UltimaData],
            )
        return {"ok": True, "id": rs.last_insert_rowid}

    @rotas.put("/manutencoes/{id}")
    def atualizar_manutencao(id: int, manutencao: NovaManutencao):
        with conectar() as client:
            garantir_tabela(client)
            client.execute(
                "UPDATE manutencoes SET Veiculo = ?, Nome = ?, IntervaloKm = ?, UltimaKm = ?, "
                "IntervaloMeses = ?, UltimaData = ? WHERE id = ?",
                [manutencao.Veiculo.strip(), manutencao.Nome.strip(), manutencao.IntervaloKm,
                 manutencao.UltimaKm, manutencao.IntervaloMeses, manutencao.UltimaData, id],
            )
        return {"ok": True}

    @rotas.delete("/manutencoes/{id}", status_code=204)
    def remover_manutencao(id: int):
        with conectar() as client:
            garantir_tabela(client)
            client.execute("DELETE FROM manutencoes WHERE id = ?", [id])

    return rotas
