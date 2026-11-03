#!/bin/bash
# Início do container do Órbita.
#
# Instala a interface do Órbita em meshcentral-web/public (a pasta que o
# MeshCentral serve no lugar da interface original) e só então entrega o
# controle ao entrypoint do MeshCentral. Como isso acontece antes de o
# MeshCentral subir, a interface do Órbita está sempre no ar desde o
# primeiro início, e cada versão nova da imagem substitui a anterior.
set -euo pipefail

ORIGEM=/opt/orbita/public
WEB=/opt/meshcentral/meshcentral-web/public
LISTA="$WEB/.orbita-arquivos"

mkdir -p "$WEB"

# Apaga os arquivos que a versão anterior instalou e que não existem mais.
if [[ -f "$LISTA" ]]; then
    while IFS= read -r f; do
        [[ -e "$ORIGEM/$f" ]] || rm -f "$WEB/$f"
    done < "$LISTA"
fi

cp -a "$ORIGEM/." "$WEB/"
(cd "$ORIGEM" && find . -type f | sed 's|^\./||') > "$LISTA"
echo "Órbita $(cat /opt/orbita/VERSAO 2>/dev/null || echo dev): interface instalada em $WEB"

exec /bin/bash /opt/meshcentral/entrypoint.sh "$@"
