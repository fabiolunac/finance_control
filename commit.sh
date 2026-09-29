#!/bin/bash
# Adiciona todas as alterações, commita com a mensagem passada, traz o que
# houver de novo no remoto (rebase) e dá push.
# Uso: ./commit.sh "mensagem do commit"

set -e

if [ -z "$1" ]; then
  echo "Uso: ./commit.sh \"mensagem do commit\""
  exit 1
fi

git add -A
git commit -m "$1"
git pull --rebase
git push
