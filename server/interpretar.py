"""Lançamento por frase: "padaria R$3 hoje" vira os campos de um gasto.

O app manda a frase e a data de hoje (a do aparelho, não a do servidor, que
roda em UTC). O Claude devolve valor, local, data, tipo e forma de pagamento,
corrigindo a grafia e usando os locais e bancos que já existem na tabela pra
não criar variações do mesmo nome. Esta rota não grava nada: quem grava é o
app, pela rota normal de gastos, e o aviso dele tem "Desfazer".

Sem ANTHROPIC_API_KEY configurada, a rota responde 503 e o app avisa.
"""

import json
import os
from datetime import date

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

# Haiku: o menor e mais barato; basta pra separar local, valor e data
MODELO = "claude-haiku-5-5"
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

# Quantos nomes de local mandar como referência (os mais usados primeiro)
MAX_LOCAIS = 300

ESQUEMA = {
    "type": "object",
    "properties": {
        "entendeu": {
            "type": "boolean",
            "description": "false se a frase não descreve um gasto ou pagamento com valor",
        },
        "valor": {"type": "number", "description": "Valor em reais, positivo"},
        "local": {"type": "string"},
        "data": {"type": "string", "description": "AAAA-MM-DD"},
        "tipo": {"type": "string", "enum": ["Gasto", "Pagamento"]},
        "pago_com": {
            "type": "string",
            "enum": ["", "Alelo", "Alelo Refeição"],
            "description": '"" quando foi banco ou cartão; "Alelo" para alimentação; "Alelo Refeição" para refeição',
        },
        "banco": {
            "type": "string",
            "description": 'Banco citado na frase, ou "" se não citou ou se foi Alelo',
        },
    },
    "required": ["entendeu", "valor", "local", "data", "tipo", "pago_com", "banco"],
    "additionalProperties": False,
}

SISTEMA = """Você converte uma frase curta, escrita ou ditada em português, num lançamento de um app de controle de gastos pessoal em reais.

Regras:
- valor: em reais. "3 conto", "três reais", "R$3" e "3,50" são valores. Sem valor na frase, entendeu = false.
- local: o estabelecimento ou o que foi comprado. A frase vem digitada às pressas no celular: erros de digitação, falta de acento e letras trocadas são comuns ("padsria", "farmacia", "mercadp"). Se algum dos locais já cadastrados corresponde ao que a frase diz, mesmo com erro de grafia, use esse nome exatamente como está escrito na lista. Se a frase é genérica ("padaria") e só um local cadastrado é claramente uma padaria, use ele; se houver vários ou nenhum, escreva o termo da frase com a grafia corrigida, acentos e inicial maiúscula ("Padaria", "Farmácia").
- data: calcule a partir da data de hoje informada. "ontem", "anteontem", "sexta", "dia 12" valem. Sem menção a dia, use hoje. Nunca use data no futuro.
- tipo: "Pagamento" só quando a frase fala em pagar fatura ou conta de cartão; nos demais casos, "Gasto".
- pago_com: "Alelo" quando a frase fala em Alelo, VA ou vale-alimentação; "Alelo Refeição" para VR, vale-refeição ou Alelo refeição; senão "".
- banco: só se a frase citar um banco ou cartão; use o nome da lista de bancos cadastrados quando corresponder. Senão "".
- Se a frase não descreve um gasto, entendeu = false e os demais campos podem ficar vazios ou zero."""


class PedidoInterpretar(BaseModel):
    texto: str = Field(min_length=1, max_length=300)
    hoje: date


def _nomes_cadastrados(client):
    locais = [
        row[0]
        for row in client.execute(
            "SELECT Local FROM gastos WHERE Local IS NOT NULL AND Local <> '' "
            "GROUP BY Local ORDER BY COUNT(*) DESC LIMIT ?",
            [MAX_LOCAIS],
        ).rows
    ]
    bancos = [
        row[0]
        for row in client.execute(
            "SELECT DISTINCT banco FROM gastos WHERE banco IS NOT NULL AND banco <> '' "
            "AND banco NOT LIKE 'Alelo%' ORDER BY banco"
        ).rows
    ]
    return locais, bancos


def criar_rotas(conectar, checar_token):
    router = APIRouter()
    claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

    @router.post("/api/interpretar")
    def interpretar(pedido: PedidoInterpretar, _=Depends(checar_token)):
        if claude is None:
            raise HTTPException(503, "O servidor não tem a chave do Claude (ANTHROPIC_API_KEY).")

        with conectar() as client:
            locais, bancos = _nomes_cadastrados(client)

        dia_semana = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"][pedido.hoje.weekday()]
        mensagem = (
            f"Locais já cadastrados: {json.dumps(locais, ensure_ascii=False)}\n"
            f"Bancos já cadastrados: {json.dumps(bancos, ensure_ascii=False)}\n\n"
            f"Hoje é {dia_semana}, {pedido.hoje.isoformat()}.\n"
            f"Frase: {pedido.texto}"
        )

        try:
            # O Haiku não tem troca automática de modelo em caso de recusa;
            # recusa vira a mensagem "não consegui entender" lá embaixo
            resposta = claude.messages.create(
                model=MODELO,
                max_tokens=2000,
                output_config={"effort": "low", "format": {"type": "json_schema", "schema": ESQUEMA}},
                system=SISTEMA,
                messages=[{"role": "user", "content": mensagem}],
            )
        except anthropic.AuthenticationError:
            raise HTTPException(502, "A chave do Claude configurada no servidor foi recusada.")
        except anthropic.RateLimitError:
            raise HTTPException(503, "O Claude está sobrecarregado agora. Tente de novo em instantes.")
        except (anthropic.APIStatusError, anthropic.APIConnectionError):
            raise HTTPException(502, "Não consegui falar com o Claude. Tente de novo.")

        if resposta.stop_reason in ("refusal", "max_tokens"):
            raise HTTPException(422, "Não consegui entender essa frase. Preencha à mão.")

        texto = next((b.text for b in resposta.content if b.type == "text"), None)
        try:
            dados = json.loads(texto)
        except (TypeError, ValueError):
            raise HTTPException(502, "O Claude devolveu uma resposta que não consegui ler.")

        if not dados["entendeu"] or dados["valor"] <= 0:
            raise HTTPException(422, "Não achei um gasto com valor nessa frase.")

        # Data no futuro ou malformada volta pra hoje
        try:
            data = date.fromisoformat(dados["data"])
        except ValueError:
            data = pedido.hoje
        if data > pedido.hoje:
            data = pedido.hoje

        return {
            "Valor": round(dados["valor"], 2),
            "Local": dados["local"].strip(),
            "Data": data.isoformat(),
            "tipo": dados["tipo"],
            "pagocom": dados["pago_com"],
            "banco": dados["banco"].strip(),
        }

    return router
