# Órbita — detalhes do projeto

O Órbita substitui toda a interface clássica do MeshCentral (painel + login) por uma
experiência própria, entregue como arquivos extras servidos por cima dos originais. Nenhum arquivo do MeshCentral e
nenhuma configuração (`config.json`) é alterada.

## O que muda

- **Marca nova**: "Órbita · Central de acesso remoto", logotipo próprio, ícones da aba e do app.
- **Visual**: fonte Geist (hospedada no próprio servidor), tema claro e escuro, ícones lineares
  no lugar das imagens antigas, cartões, diálogos e menus redesenhados.
- **Login**: tela escura com fundo animado bem lento e cartão de vidro.
- **Ferramentas em fácil acesso**:
  - Ao passar o mouse num dispositivo online aparecem atalhos de **Área de trabalho**,
    **Terminal** e **Arquivos**: um clique abre a ferramenta e já conecta.
  - **Busca rápida** (`Ctrl+K` ou `/`): procura dispositivo por nome, grupo, sistema ou IP e
    abre direto (`Enter` = geral, `Shift+Enter` = desktop, `Ctrl+Enter` = terminal,
    `Alt+Enter` = arquivos). Também navega pelas seções e troca o tema.
  - Abas do dispositivo com ícones, com Desktop/Terminal/Arquivos em destaque.
  - Resumo de dispositivos online/offline no topo e barra de status no rodapé.
  - Botão de tema claro/escuro e menu do usuário no cabeçalho.
- Animações leves (entrada de painéis, cartões e diálogos); respeita "reduzir movimento" do sistema.

Os atalhos de teclado nunca são capturados na área de trabalho remota, no terminal, no
console nem enquanto se digita num campo.

## Área de trabalho remota

- **Tela cheia (quando você quiser):** o botão "Tela cheia" na barra de abas põe o desktop na
  página inteira (e em tela cheia do navegador). Nesse modo as barras flutuam e aparecem com o
  mouse perto da borda; a pílula no topo tem **Preencher/Ajustar** (sem bordas pretas, podendo
  esticar a imagem) e **Sair**. Ao conectar, o desktop não muda de tamanho sozinho.
- **Ctrl+V imediato:** o texto copiado vai para o computador remoto antes da tecla V. Depois de
  um Ctrl+C lá, a cópia volta logo para o seu PC (precisa da opção de área de transferência
  automática ligada nas Configurações do desktop).
- **Arquivos:** colar (Ctrl+V) ou arrastar arquivos para o desktop envia para a Área de Trabalho
  Pública do Windows (`C:\Users\Public\Desktop`) ou para `/tmp` no Linux. Scripts e `.txt`
  arrastados continuam com o comportamento do MeshCentral (executar/digitar). Copiar arquivo no
  computador remoto e colar no seu PC não é possível pelo navegador: use a aba Arquivos.
- **RDP:** em servidores Windows, o botão de conexão RDP abre a sessão já na resolução da tela,
  sem bordas pretas.

## Arquivos (gerenciador estilo Explorer)

A aba Arquivos ganhou uma tela no estilo do Explorer do Windows (`scripts/orbita-files.js`):
voltar/avançar/subir, barra de endereço clicável ou digitável, pesquisa na pasta, painel lateral
(Área de Trabalho, Documentos, Downloads, unidades), colunas Nome/Data/Tipo/Tamanho com ordenação,
exibição em detalhes ou ícones grandes, menu do botão direito e barra de status.

- **Do PC para o computador remoto:** arraste arquivos **ou pastas** do Windows para a lista (ou
  para cima de uma pasta), cole com Ctrl+V arquivos copiados no Explorer, ou use Carregar >
  Arquivos/Pasta. Pastas são recriadas com as subpastas.
- **Do computador remoto para o PC:** arraste um arquivo da lista para a Área de Trabalho ou uma
  pasta do Windows (Chrome/Edge), dê duplo clique, ou selecione vários e use Baixar. Ctrl+C aqui e
  Ctrl+V no Windows não é possível: o navegador não deixa colocar arquivos na área de
  transferência do sistema.
- **Dentro do computador remoto:** Ctrl+C / Ctrl+X e Ctrl+V entre pastas, arrastar para uma
  pasta para mover, F2 renomeia, Delete exclui, Ctrl+Shift+N cria pasta, Backspace volta.
- Limitações do agente do MeshCentral: copiar/mover funciona só com arquivos (pastas não), e
  arquivos vazios não são enviados. Em Linux/macOS, o tema corrige os caminhos de copiar/mover,
  que falham na interface original.
- A lista original do MeshCentral continua na página, escondida; todas as operações usam as
  funções dela.

## Instalar / atualizar

```bash
./instalar.sh
```

Na primeira instalação o container `meshcentral` é reiniciado uma vez (~30 s), porque o
MeshCentral só reconhece a pasta `meshcentral-web/public` ao iniciar. Depois disso,
atualizações entram sem reiniciar.

## Remover (voltar ao original)

```bash
./remover.sh
```

Não precisa reiniciar; basta recarregar a página.

## Trocar o nome da marca

Em `src/custom.js`, altere `BRAND` no topo e rode `src/construir.sh` e `./instalar.sh`.

## Estrutura

- `src/orbita.src.css` — fonte do tema (os ícones entram como `%%ICON:nome%%`).
- `src/icons.py` — ícones SVG usados no CSS.
- `src/custom.js` — marca, busca rápida, atalhos, desktop remoto, encaixe das áreas roláveis.
- `src/orbita-files.js` — gerenciador de arquivos estilo Explorer.
- `src/orbita-touch.js` — ponteiro, gestos e teclado do desktop remoto em aparelhos sem mouse.
- `src/construir.sh` — gera `dist/` a partir de `src/`.
- `dist/public/` — arquivos prontos, copiados para `/opt/meshcentral/meshcentral-web/public`.

## Observações

- Vale para a interface clássica (a padrão), que o Órbita também entrega em celulares: a
  página "mobile" própria do MeshCentral é trocada pela clássica (`?mobile=0`), que abaixo de
  760 px ganha menu inferior, abas roláveis, cartões em coluna e gerenciador de arquivos
  compacto. A "nova interface" (Bootstrap) continua com o visual original.
- A tela remota do MeshCentral só escuta o mouse. Em aparelhos sem mouse, o
  `scripts/orbita-touch.js` lê os gestos e os envia pelas funções da própria página, e o botão
  flutuante abre o teclado do aparelho, que a interface clássica não tem.
- O Safari do iPhone pode continuar usando scripts antigos depois de uma atualização. Por
  isso o `construir.sh` grava uma versão no `custom.js` e em `orbita/versao.txt`: a página
  confere as duas ao abrir e, se diferirem, baixa os arquivos de novo e recarrega.
- O MeshCentral recalcula a altura de listas, desktop e terminal em JavaScript; o tema
  mede e encaixa essas áreas automaticamente para nada ficar escondido atrás do rodapé.
- Testado no MeshCentral 1.2.6. Em atualizações do MeshCentral, confira as telas
  principais; se algo destoar, `./remover.sh` volta ao original na hora.
