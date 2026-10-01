"""Notificações push (Web Push com chaves VAPID).

Cada aparelho que ativa as notificações manda a inscrição dele (endpoint +
chaves), guardada em push_inscricoes. enviar() manda a mesma mensagem pra
todas; inscrição que o serviço de push diz não existir mais (404/410) sai.

No iPhone só funciona com o app instalado na tela de início (iOS 16.4+).
Sem VAPID_PRIVATE_KEY/VAPID_PUBLIC_KEY configuradas, nada é enviado e o app
mostra que o servidor não tem notificações.
"""

import json
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from pywebpush import WebPushException, webpush

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY")
# A Apple exige um contato (mailto: ou https://); o site do app serve
VAPID_SUBJECT = os.environ.get("VAPID_SUBJECT") or os.environ.get("ALLOWED_ORIGIN", "")

TABELA = """CREATE TABLE IF NOT EXISTS push_inscricoes (
    Endpoint TEXT PRIMARY KEY, P256dh TEXT NOT NULL, Auth TEXT NOT NULL, Criada TEXT NOT NULL)"""


class ChavesInscricao(BaseModel):
    p256dh: str = Field(min_length=1)
    auth: str = Field(min_length=1)


class Inscricao(BaseModel):
    endpoint: str = Field(min_length=1, max_length=1000)
    keys: ChavesInscricao


class Cancelamento(BaseModel):
    endpoint: str = Field(min_length=1, max_length=1000)


def configurado():
    return bool(VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY and VAPID_SUBJECT)


def garantir_tabela(client):
    client.execute(TABELA)


def enviar(client, titulo, corpo, url="./"):
    """Manda pra todos os aparelhos inscritos. Devolve quantos receberam; nunca levanta erro."""
    if not configurado():
        return 0
    garantir_tabela(client)
    inscricoes = client.execute("SELECT Endpoint, P256dh, Auth FROM push_inscricoes").rows
    mensagem = json.dumps({"titulo": titulo, "corpo": corpo, "url": url})
    enviados = 0
    for endpoint, p256dh, auth in inscricoes:
        try:
            webpush(
                subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
                data=mensagem,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_SUBJECT},
                ttl=3600,
            )
            enviados += 1
        except WebPushException as e:
            status = e.response.status_code if e.response is not None else None
            if status in (404, 410):
                client.execute("DELETE FROM push_inscricoes WHERE Endpoint = ?", [endpoint])
        except Exception:
            pass  # um aparelho com problema não impede os outros nem quebra a rota que chamou
    return enviados


def criar_rotas(conectar, checar_token):
    """conectar e checar_token vêm do main.py, pra não duplicar a conexão e o token."""
    rotas = APIRouter(prefix="/api/push", dependencies=[Depends(checar_token)])

    @rotas.get("/chave")
    def chave_publica():
        return {"chave": VAPID_PUBLIC_KEY if configurado() else None}

    @rotas.post("/inscricao", status_code=201)
    def inscrever(inscricao: Inscricao):
        with conectar() as client:
            garantir_tabela(client)
            client.execute(
                "INSERT OR REPLACE INTO push_inscricoes (Endpoint, P256dh, Auth, Criada) VALUES (?, ?, ?, ?)",
                [inscricao.endpoint, inscricao.keys.p256dh, inscricao.keys.auth,
                 datetime.now(timezone.utc).isoformat(timespec="seconds")],
            )
        return {"ok": True}

    @rotas.post("/cancelar")
    def cancelar(cancelamento: Cancelamento):
        with conectar() as client:
            garantir_tabela(client)
            client.execute("DELETE FROM push_inscricoes WHERE Endpoint = ?", [cancelamento.endpoint])
        return {"ok": True}

    @rotas.post("/teste")
    def teste():
        if not configurado():
            raise HTTPException(status_code=503, detail="O servidor ainda não tem as chaves de notificação.")
        with conectar() as client:
            enviados = enviar(client, "Controle Pessoal", "Notificação de teste: está funcionando.")
        if not enviados:
            raise HTTPException(status_code=404, detail="Nenhum aparelho recebeu. Ative as notificações de novo.")
        return {"ok": True, "enviados": enviados}

    return rotas
