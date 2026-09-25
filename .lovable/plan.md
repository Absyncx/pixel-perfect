# CineCasa — plano de construção

Plataforma de streaming doméstica: interface no estilo Netflix, com o catálogo, os perfis e os vídeos todos guardados no seu PC.

## Como vai funcionar

Duas peças:

1. **CineCasa Server** — um programa que você roda no seu computador (Windows). Ele varre suas pastas de filmes e séries, guarda tudo num banco local (SQLite, um único arquivo), serve as imagens e transmite os vídeos em pedaços (para poder avançar/voltar sem baixar o filme inteiro).
2. **A interface** — as telas que você e sua esposa usam. Ela é servida pelo próprio CineCasa Server, então na TV, no celular ou no tablet vocês acessam `http://IP-DO-SEU-PC:8420`.

Nada sai para a internet, exceto as buscas opcionais de capa e sinopse no TMDB.

```text
TV / celular / tablet  ──►  http://IP-DO-PC:8420
                                  │
                          CineCasa Server (seu PC)
                          ├─ interface (telas)
                          ├─ catálogo em SQLite
                          ├─ varredura das pastas
                          ├─ transmissão dos vídeos
                          └─ TMDB (opcional, capas)
```

Aqui dentro do Lovable eu construo e mostro a interface. Como o Lovable não enxerga o seu disco, no preview ela aparece com um aviso claro de "servidor local não conectado" — sem catálogo falso. Ao rodar no seu PC, ela mostra a sua biblioteca de verdade.

## Etapas

### Etapa 1 — Interface e identidade visual
Tema escuro cinematográfico, vermelho como destaque, cantos arredondados, animações discretas. Tudo em português.
- Seletor de perfil na entrada
- Início: banner de destaque, "Continuar assistindo", "Minha lista", fileiras por gênero/década/recentes
- Filmes: grade com ordenação, filtros e busca instantânea
- Séries: temporadas e episódios com miniaturas
- Página de detalhes (filme e série)
- Player próprio em tela cheia
- Configurações e painel administrativo
- Navegação por setas do controle remoto e teclado, foco bem visível, botões grandes na TV
- Estados honestos: biblioteca vazia, servidor offline, arquivo indisponível

### Etapa 2 — Banco de dados local
Estrutura SQLite com: perfis, filmes, séries, temporadas, episódios, arquivos de mídia, legendas, gêneros, progresso, histórico, minha lista, configurações do servidor e registros de varredura. Um filme pode ter várias versões de arquivo (1080p e 4K). Apagar um arquivo não apaga os metadados.

### Etapa 3 — Servidor local
- Configuração de pastas de filmes e séries, porta e endereço
- Varredura recursiva, detecção de novos/removidos/duplicados, sem renomear nem apagar nada
- Reconhecimento de nomes: `Interestelar (2014).mkv`, `Breaking.Bad.S01E01.1080p.mkv`, pastas `Season 01`
- O que não for identificado com segurança vai para uma fila de revisão manual — nunca inventa título
- Transmissão com HTTP Range, sem carregar o arquivo na memória
- Bloqueio de acesso fora das pastas autorizadas (anti path traversal)
- Endpoint de saúde, senha de administrador, sessões
- Instruções de instalação no Windows e liberação no firewall só para a rede doméstica

### Etapa 4 — Integração
Ligar as telas ao servidor real: catálogo, perfis, listas e progresso vindos do seu PC. Progresso salvo a cada 10 segundos e ao pausar/sair, sincronizado entre dispositivos e separado por perfil. Concluído em ~90% (ajustável).

### Etapa 5 — Player e conversão
Legendas externas .srt/.vtt com detecção de idioma, escolha de faixa de áudio quando possível, próximo episódio com contagem regressiva desligável, atalhos de teclado, velocidade de reprodução.
Estratégia de reprodução: toca o arquivo original quando o navegador aceita; reempacota quando basta; converte com FFmpeg no servidor só quando necessário, com limite de uso configurável.

### Etapa 6 — Capas, testes e documentação
Busca de capas, sinopses, elenco e episódios no TMDB, com correção manual quando o resultado vier errado. A chave fica guardada no servidor, nunca na interface. Sem internet, o catálogo continua funcionando com o que já foi salvo.
Testes em computador, celular e TV, e um manual de instalação e manutenção.

## Detalhes técnicos

- Interface: React + TypeScript + Tailwind, construída aqui no Lovable.
- Servidor: Node.js + TypeScript (Fastify), SQLite via better-sqlite3, streaming com `fs.createReadStream` e cabeçalhos `Content-Range`. Roda como processo local; empacotado com um `start.bat` e instruções de serviço do Windows.
- Camada de integração: um cliente único no frontend com URL base configurável, de modo que nenhuma tela fale diretamente com o disco.
- FFmpeg como dependência externa opcional, detectada no início; se não estiver instalado, a conversão fica desativada e avisada na tela.
- Chave do TMDB em variável de ambiente do servidor.
- Lovable Cloud não será usado — todos os dados ficam no seu PC, conforme você escolheu.

## Onde preciso de você

- Caminhos reais das suas pastas de filmes e séries (na configuração, depois de instalar).
- Chave do TMDB (conta gratuita em themoviedb.org) quando chegarmos na Etapa 6.

## Primeira entrega

Etapas 1, 2 e 3 juntas: interface completa, banco local e servidor de mídia funcionando no Windows.
