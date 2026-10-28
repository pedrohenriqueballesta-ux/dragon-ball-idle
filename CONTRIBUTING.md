# Como contribuir no Dragon Ball Idle

Guia rápido pro time trabalhar junto sem pisar no pé um do outro.
A regra mais importante está no fim: **ninguém mexe direto na `main`**.

## 1. Uma vez só (cada dev, no começo)

Baixe o projeto pro seu computador:

```bash
git clone https://github.com/pedrohenriqueballesta-ux/dragon-ball-idle.git
cd dragon-ball-idle
```

Pré-requisito: ter o **Node.js 22 ou superior** instalado (https://nodejs.org/).
Não precisa de `npm install`: o protótipo roda só com recursos nativos.

Para jogar/testar localmente:

```bash
npm start
```

Depois abra http://localhost:3000 no navegador.

## 2. Toda vez que for trabalhar (o ciclo)

**1. Pegue a versão mais nova** (o que os outros já enviaram):

```bash
git checkout main
git pull
```

**2. Crie uma branch só sua**, com um nome do que vai fazer:

```bash
git checkout -b minha-mudanca
```

> Ex.: `arrumar-goku`, `inimigo-novo`, `ajuste-hud`.

**3. Mexa no código.** Quando terminar um pedaço, salve:

```bash
git add .
git commit -m "descreva o que fez"
```

> Pode commitar várias vezes, quantas quiser.

**4. Antes de enviar, confira que não quebrou nada:**

```bash
npm run check
npm test
```

**5. Envie sua branch pro GitHub:**

```bash
git push -u origin minha-mudanca
```

**6. Abra o Pull Request (PR):**

- Depois do push, abra o repositório no site. Costuma aparecer um aviso amarelo
  **"Compare & pull request"**, é só clicar.
- Se não aparecer: aba **Pull requests** → **New pull request** → em **base**
  deixe `main`, em **compare** escolha a sua branch → **Create pull request**.

**7. Juntar.** Outro dev dá uma olhada e alguém clica no botão verde **Merge**.
Pronto, sua mudança entrou na `main` pra todo mundo.

**8. Acabou esse pedaço?** Volte ao passo 1 pra começar o próximo (sempre com a
`main` atualizada primeiro).

## 3. A regra de ouro

**Ninguém faz `git push` direto na `main`.** Todo mundo sempre cria uma branch
(passo 2) e manda por Pull Request. Isso evita que um quebre o trabalho do outro.

## 4. Onde fica cada coisa no código

| Pasta/arquivo | O que é |
| --- | --- |
| `public/shared/` | Regras do jogo (config, math, characters, enemies, game) |
| `public/shared/config.mjs` | Números de balanceamento e mapa (fácil de ajustar) |
| `public/shared/enemies.mjs` | Inimigos (Saibaman, Alien, Freeza) e onde nascem |
| `public/shared/characters.mjs` | Goku: progressão e inventário inicial |
| `public/client/game.mjs` | Interface, controles e desenho da tela |
| `public/art/` | Desenho de cada personagem/cenário (goku, freeza, terrain...) |
| `public/render/camera.mjs` | Câmera, zoom e animação |
| `server.mjs` | Servidor local |
| `tests/` | Testes automáticos (rode com `npm test`) |

Antes de mudar regras do jogo, vale ler `AGENTS.md` e `LEIA_PRIMEIRO.md`.

## 5. Dica

Se terminal e comandos forem complicados pra alguém, dá pra usar o
**GitHub Desktop** (https://desktop.github.com/): ele faz clonar, branch, commit,
push e abrir PR tudo por botões, sem digitar comando.
