# Órbita — tema para o MeshCentral

Interface nova, em português, para o painel web do [MeshCentral](https://github.com/Ylianst/MeshCentral):
marca própria, tema claro e escuro, busca rápida (`Ctrl+K`), cartões de dispositivo com atalhos,
desktop remoto com tela cheia sob demanda e um gerenciador de arquivos no estilo do Explorer do
Windows.

O tema é um conjunto de arquivos extras (CSS, JS, fontes e ícones) que o MeshCentral serve por
cima dos originais. Nenhum arquivo do MeshCentral nem o `config.json` são alterados, e `./remover.sh`
volta ao visual original na hora.

## Créditos

O Órbita foi escrito com base no **MeshCentral**, de **Ylian Saint-Hilaire** e colaboradores
(projeto iniciado na Intel), distribuído sob a licença
[Apache 2.0](https://github.com/Ylianst/MeshCentral/blob/master/LICENSE).

- Código-fonte do MeshCentral: <https://github.com/Ylianst/MeshCentral>
- Site oficial: <https://meshcentral.com>

Todo o funcionamento (servidor, agentes, desktop remoto, terminal, arquivos) é do MeshCentral; o
Órbita muda só a interface do navegador. O Órbita é um projeto independente: não é afiliado nem
endossado pelo MeshCentral ou pelos seus autores, e "MeshCentral" é usado aqui apenas para
indicar a origem.

Também usa:

- Fonte [Geist e Geist Mono](https://github.com/vercel/geist-font), © The Geist Project Authors,
  licença SIL Open Font License 1.1 (`licencas/Geist-OFL.txt`).
- Ícones no estilo [Lucide](https://lucide.dev), © Lucide Icons and Contributors, licença ISC
  (`licencas/Lucide-ISC.txt`).

## Instalação rápida

Com o MeshCentral rodando em Docker (container `meshcentral`):

```bash
git clone https://github.com/prudenciooficial/orbita.git
cd orbita
./instalar.sh            # ou ./instalar.sh nome-do-container
```

Na primeira instalação o container é reiniciado uma vez (~30 s), porque o MeshCentral só
reconhece a pasta `meshcentral-web/public` ao iniciar. Para voltar ao original: `./remover.sh`.

Detalhes do que muda, estrutura do código e limitações conhecidas estão no [LEIA-ME.md](LEIA-ME.md).
Testado no MeshCentral 1.2.6, na interface clássica.

## Como contribuir

Contribuições são bem-vindas: correções, melhorias visuais, compatibilidade com novas versões
do MeshCentral e traduções.

1. Faça um fork e crie um branch para a sua mudança.
2. Edite os arquivos em `src/` (não em `dist/`) e gere os arquivos prontos com `src/construir.sh`.
3. Teste num MeshCentral de testes (não em produção): `./instalar.sh` e confira as telas
   principais nos temas claro e escuro.
4. Abra um pull request explicando o que mudou e em qual versão do MeshCentral você testou.

Para relatar problemas, abra uma issue com a versão do MeshCentral, o navegador e, se possível,
uma captura de tela.
