#!/bin/bash
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Instale Node.js 22 ou superior em https://nodejs.org e tente novamente."
  exit 1
fi
node server.mjs
