#!/bin/bash
# Início do container do Órbita.
#
# Copia a interface do Órbita para meshcentral-web/public (a pasta que o
# MeshCentral serve por cima da interface original) e só então entrega o
# controle ao entrypoint oficial do MeshCentral. Como a cópia acontece antes
# de o MeshCentral subir, não é preciso reiniciar na primeira instalação, e
# uma imagem nova do Órbita sempre substitui os arquivos da versão anterior.
#
# ORBITA_DESATIVAR=true remove os arquivos do Órbita e sobe a interface
# original do MeshCentral (útil para diagnosticar problemas).
set -euo pipefail

ORIGEM=/opt/orbita/public
WEB=/opt/meshcentral/meshcentral-web/public
LISTA="$WEB/.orbita-arquivos"
DESATIVAR="${ORBITA_DESATIVAR:-}"
DESATIVAR="${DESATIVAR,,}"

mkdir -p "$WEB"

# Apaga os arquivos que a versão anterior instalou e que não existem mais
# (ou todos, se o Órbita foi desativado).
if [[ -f "$LISTA" ]]; then
    while IFS= read -r f; do
        if [[ "$DESATIVAR" =~ ^(true|yes|1)$ || ! -e "$ORIGEM/$f" ]]; then
            rm -f "$WEB/$f"
        fi
    done < "$LISTA"
    rm -f "$LISTA"
fi

if [[ "$DESATIVAR" =~ ^(true|yes|1)$ ]]; then
    echo "Órbita: desativado (ORBITA_DESATIVAR); usando a interface original do MeshCentral."
else
    cp -a "$ORIGEM/." "$WEB/"
    (cd "$ORIGEM" && find . -type f | sed 's|^\./||') > "$LISTA"
    echo "Órbita $(cat /opt/orbita/VERSAO 2>/dev/null || echo dev): interface instalada em $WEB"
fi

exec /bin/bash /opt/meshcentral/entrypoint.sh "$@"
