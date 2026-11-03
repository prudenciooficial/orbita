# Órbita — Central de acesso remoto

O Órbita é uma central de acesso e gerenciamento remoto de computadores, em português,
construída sobre o [MeshCentral](https://github.com/Ylianst/MeshCentral). Ele usa o motor do
MeshCentral (servidor, agentes e conexões) e entrega por cima uma experiência própria de ponta
a ponta no navegador: identidade visual, navegação, busca, desktop remoto, terminal e um
gerenciador de arquivos completo no estilo do Explorer do Windows.

São cerca de 3.900 linhas de código próprio (JavaScript, CSS e ferramentas de construção),
instaladas sobre um servidor MeshCentral sem alterar nenhum arquivo dele.

## Recursos

**Painel**
- Identidade Órbita completa: logotipo, ícones lineares próprios, fonte Geist, tema claro e escuro.
- Tela de login redesenhada, com fundo escuro animado e cartão de vidro.
- Dispositivos em cartões com status e atalhos rápidos de **Área de trabalho**, **Terminal** e
  **Arquivos**: um clique abre a ferramenta já conectada.
- **Busca rápida** (`Ctrl+K` ou `/`): encontra dispositivos por nome, grupo, sistema ou IP e abre
  direto na ferramenta certa (`Enter`, `Shift+Enter`, `Ctrl+Enter`, `Alt+Enter`); também navega
  pelas seções e troca o tema.
- Resumo de dispositivos online/offline, barra de status flutuante, abas com ícones e
  animações leves que respeitam "reduzir movimento".

**Área de trabalho remota**
- Tela cheia sob demanda, com barras flutuantes que aparecem perto da borda, e modos
  **Ajustar** e **Preencher** (sem bordas pretas). Nunca entra em tela cheia sozinha.
- `Ctrl+V` envia primeiro o texto da sua área de transferência e só depois a tecla.
- Arquivos colados ou arrastados para o desktop vão direto para o computador remoto.

**Gerenciador de arquivos estilo Explorer**
- Voltar, avançar, subir, barra de endereço clicável ou digitável e pesquisa na pasta.
- Painel lateral com Área de Trabalho, Documentos, Downloads e unidades.
- Colunas Nome, Data, Tipo e Tamanho com ordenação; exibição em detalhes ou ícones grandes.
- Seleção com clique, `Ctrl` e `Shift`, menu do botão direito e atalhos (`F2`, `Delete`,
  `Ctrl+A/C/X/V`, `Ctrl+Shift+N`, `Backspace`).
- Do PC para o remoto: arraste arquivos e pastas do Windows ou cole com `Ctrl+V`.
- Do remoto para o PC: arraste para uma pasta do Windows (Chrome/Edge), duplo clique ou baixe vários.

A lista completa, com detalhes e limitações conhecidas, está no [LEIA-ME.md](LEIA-ME.md).

## Como funciona

```
Navegador ──► Órbita (interface, busca, desktop, arquivos)
                 │
                 ▼
          Servidor MeshCentral ──► agentes nos computadores
```

O Órbita é servido pelo próprio MeshCentral a partir da pasta `meshcentral-web/public` e
conversa com ele pelas funções da interface web. Por isso funciona com o servidor e os agentes
do MeshCentral que você já tem, e atualizar o MeshCentral não apaga o Órbita.

## Instalação

Com o MeshCentral rodando em Docker (container `meshcentral`):

```bash
git clone https://github.com/prudenciooficial/orbita.git
cd orbita
./instalar.sh            # ou ./instalar.sh nome-do-container
```

Na primeira instalação o container é reiniciado uma vez (~30 s), porque o MeshCentral só
reconhece a pasta `meshcentral-web/public` ao iniciar. Para desinstalar: `./remover.sh`.

Testado no MeshCentral 1.2.6, na interface clássica.

## Como contribuir

Contribuições são bem-vindas: correções, novos recursos, melhorias visuais, compatibilidade com
novas versões do MeshCentral e traduções.

1. Faça um fork e crie um branch para a sua mudança.
2. Edite os arquivos em `src/` (não em `dist/`) e gere os arquivos prontos com `src/construir.sh`.
3. Teste num MeshCentral de testes (não em produção): `./instalar.sh` e confira as telas
   principais nos temas claro e escuro.
4. Abra um pull request explicando o que mudou e em qual versão do MeshCentral você testou.

Para relatar problemas, abra uma issue com a versão do MeshCentral, o navegador e, se possível,
uma captura de tela.

## Créditos

O Órbita é construído sobre o **MeshCentral**, de **Ylian Saint-Hilaire** e colaboradores
(projeto iniciado na Intel), distribuído sob a licença
[Apache 2.0](https://github.com/Ylianst/MeshCentral/blob/master/LICENSE). O servidor, os agentes
e os protocolos de conexão são do MeshCentral.

- Código-fonte do MeshCentral: <https://github.com/Ylianst/MeshCentral>
- Site oficial: <https://meshcentral.com>

O Órbita é um projeto independente: não é afiliado nem endossado pelo MeshCentral ou pelos seus
autores, e o nome "MeshCentral" é usado aqui apenas para indicar a base do projeto.

Também usa:

- Fonte [Geist e Geist Mono](https://github.com/vercel/geist-font), © The Geist Project Authors,
  licença SIL Open Font License 1.1 (`licencas/Geist-OFL.txt`).
- Ícones no estilo [Lucide](https://lucide.dev), © Lucide Icons and Contributors, licença ISC
  (`licencas/Lucide-ISC.txt`).
