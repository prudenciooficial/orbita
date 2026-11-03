#!/bin/bash
# Instala (ou atualiza) o tema Órbita no MeshCentral rodando em Docker.
# Uso: ./instalar.sh [nome-do-container]   (padrão: meshcentral)
#
# Os arquivos vão para /opt/meshcentral/meshcentral-web/public (volume
# meshcentral_meshcentral-web), que o MeshCentral serve por cima dos originais.
# Nada do MeshCentral é alterado. O MeshCentral só detecta essa pasta ao iniciar,
# então na PRIMEIRA instalação o container é reiniciado (~30 s). Atualizações
# posteriores entram na hora, sem reiniciar.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
C="${1:-meshcentral}"
WEB=/opt/meshcentral/meshcentral-web/public

docker inspect "$C" >/dev/null
if docker exec "$C" test -d "$WEB"; then primeira=0; else primeira=1; fi

docker exec "$C" mkdir -p "$WEB"
docker cp "$DIR/dist/public/." "$C:$WEB/"
docker exec "$C" sh -c "chown -R root:root '$WEB' && chmod -R a+rX '$WEB'"
echo "Arquivos copiados para $C:$WEB"

if [ "$primeira" = 1 ]; then
    echo "Primeira instalação: reiniciando $C para o MeshCentral reconhecer a pasta..."
    docker restart "$C" >/dev/null
    for i in $(seq 1 60); do
        if docker exec "$C" sh -c 'wget -q --no-check-certificate -O /dev/null https://127.0.0.1:443/styles/custom.css' 2>/dev/null; then
            echo "MeshCentral no ar com o tema."; exit 0
        fi
        sleep 2
    done
    echo "Atenção: o MeshCentral ainda não respondeu; confira com: docker logs --tail 50 $C" >&2
    exit 1
fi
echo "Tema atualizado (sem reinício). Recarregue a página no navegador."
