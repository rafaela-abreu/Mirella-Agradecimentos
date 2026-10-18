# Plano — Agradecimentos Mirella Rebecca

## Escopo

Criar um site-companheiro independente do convite original, com foco em agradecer a presença e os presentes, exibir o vídeo enviado pela família e oferecer uma galeria pública de muitas fotos com download individual. O convite original permanecerá intacto no repositório `rafaela-abreu/Aniversario-Mirella-Filha`.

## Implementação

- Aplicação Web leve em Node.js com Express, servida na porta `3000`, com HTML/CSS/JavaScript sem framework pesado.
- Página pública `/` sem local, horário, confirmação ou chamadas de convite: título “Agradecimentos”, vídeo principal, frase complementar, texto integral, galeria, downloads individuais e encerramento.
- Rota `/familia` protegida por login Manus OAuth, com sessão `webdev_app_session` compatível com Preview e permissão do responsável verificada no servidor. A área permite selecionar fotos individualmente ou em lote, enviar para armazenamento durável e publicar/remover registros da galeria.
- Banco MySQL gerenciado para indexar fotos publicadas, ordem, nome original, chave de armazenamento e data. Migração idempotente executada na inicialização.
- Objetos grandes ficam no armazenamento durável em caminhos `/manus-storage/...`; o vídeo enviado, a ursinha e as fotos iniciais são carregados como ativos do projeto. Nenhum segredo fica no navegador.
- Música do YouTube é iniciada por ação explícita do visitante em um player incorporado, respeitando bloqueios de autoplay. A URL original é `https://youtu.be/I3raNXhVN7c?is=8quSoKGcsUgmjwki`.
- A animação da ursinha usa o ativo reaproveitado do convite, com movimento suave e botão para iniciar/parar a música.
- O manifesto `manus-routes.json` declara `/`, `/familia` e `/auth/callback`.

## Design

### Estilos considerados

- **Carta de lembrança lilás** (0,06): scrapbook romântico com cartões e molduras.
- **Álbum editorial minimalista** (0,07): página clara, fotos como foco e tipografia refinada.
- **Jardim de festa delicado** (0,08): camadas de lavanda, pétalas e pequenos brilhos.

### Escolha: Carta de lembrança lilás

**Movimento de design:** carta digital de família com atmosfera de álbum de memórias, mantendo a linguagem lilás, arredondada e carinhosa do convite existente, mas com mais respiro e menos elementos de convite.

**Princípios:** conteúdo emocional em primeiro plano; fotos com molduras leves; controles grandes e claros no celular; decoração suave, sem competir com o vídeo e as pessoas.

**Filosofia de cor:** fundo marfim-lilás muito claro para sensação de papel; roxo ameixa para títulos; rosa-botão para ações e corações; lavanda translúcida para cartões; texto ameixa escuro para contraste.

**Paradigma de layout:** narrativa vertical com uma coluna principal estreita para leitura e um “varal” de fotos em colunas assimétricas que se reorganiza naturalmente no celular. A galeria fica em uma seção própria acessível pelo botão “Ver galeria”.

**Assinaturas visuais:** linha pontilhada de álbum, pequenos selos de coração e a ursinha flutuante no canto inferior sem cobrir a leitura.

**Interação:** cada ação explica o que fará; baixar fica abaixo da própria foto; o responsável recebe feedback de upload e publicação sem sair da página; o áudio nunca começa sem gesto.

**Animação:** entrada suave do conteúdo, brilho discreto em botões e balanço leve da ursinha; sem loops intensos que prejudiquem leitura ou consumo de energia.

**Tipografia:** Fredoka local do convite para títulos e textos carinhosos, com pesos fortes e boa legibilidade; sistema sans-serif como fallback. Título grande, mensagens em blocos curtos e botões com verbos explícitos.

**Essência:** uma lembrança digital de agradecimento que transforma a festa em um álbum fácil de guardar. Personalidade: carinhosa, leve, organizada.

**Voz:** íntima e agradecida, como Mirella falando com os convidados. Exemplos: “Obrigada por viver esse dia comigo” e “Escolha sua fotinha e guarde esse carinho”.

**Marca:** wordmark tipográfico “MimiCa” usado apenas como assinatura de apoio, sem substituir o título pedido.

## Estrutura de projeto

- `server.js`: servidor Express, autenticação OAuth, sessões, APIs de galeria e upload para storage.
- `public/index.html`: shell da página pública e área de galeria.
- `public/familia.html`: painel protegido do responsável.
- `public/styles.css`: tokens, layout responsivo, cartões, galeria e animações.
- `public/app.js`: renderização pública, player YouTube e downloads.
- `public/familia.js`: upload, publicação, ordenação e feedback do painel.
- `public/media/`: apenas ícones pequenos ou fallback; vídeo/fotos grandes usam storage.
- `migrations/001_gallery.sql`: tabela idempotente da galeria.
- `manus-routes.json`: rotas do site para o Preview.
- `app.config.ts`: logoUrl literal para a identidade do projeto.
