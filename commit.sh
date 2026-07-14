#!/bin/bash
# Adiciona todas as alterações, commita com a mensagem passada e dá push.
# Uso: ./commit.sh "mensagem do commit"

set -e

if [ -z "$1" ]; then
  echo "Uso: ./commit.sh \"mensagem do commit\""
  exit 1
fi

git add -A
git commit -m "$1"
git push
