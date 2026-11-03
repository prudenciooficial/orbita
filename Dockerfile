# syntax=docker/dockerfile:1
# Imagem do Órbita: MeshCentral oficial + interface do Órbita.
# A versão do MeshCentral fica fixa na versão em que o Órbita foi testado.
ARG MESHCENTRAL_VERSAO=1.2.6
FROM ghcr.io/ylianst/meshcentral:${MESHCENTRAL_VERSAO}

ARG ORBITA_VERSAO=dev
LABEL org.opencontainers.image.title="Órbita" \
      org.opencontainers.image.description="Central de acesso remoto em português, construída sobre o MeshCentral" \
      org.opencontainers.image.source="https://github.com/prudenciooficial/orbita" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.version="${ORBITA_VERSAO}"

COPY dist/public/ /opt/orbita/public/
COPY LICENSE NOTICE /opt/orbita/
COPY licencas/ /opt/orbita/licencas/
COPY --chmod=755 docker/iniciar.sh /opt/orbita/iniciar.sh
# Sem RUN: a imagem é montada para todas as arquiteturas sem emulação.
COPY --chmod=644 <<EOF /opt/orbita/VERSAO
${ORBITA_VERSAO}
EOF

ENTRYPOINT ["/bin/bash", "/opt/orbita/iniciar.sh"]
