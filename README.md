# Dragon Ball Idle

Protótipo jogável de um RPG **idle** 2D visto de cima, inspirado em Dragon Ball.
Explore o mapa, evolua o Goku, enfrente inimigos e configure a caça automática.
Roda localmente, com servidor multiplayer na sua própria máquina.

> Versão atual: **0.6** — HUD integrada, chefe Freeza, sprites de 16 quadros em
> 8 direções e as técnicas Kaioken, Barreira de Ki e Genki Dama.

## Como rodar

1. Instale o **Node.js 22 ou superior** (https://nodejs.org/).
2. Baixe o projeto:
   ```bash
   git clone https://github.com/pedrohenriqueballesta-ux/dragon-ball-idle.git
   cd dragon-ball-idle
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
4. Abra **http://localhost:3000** no navegador.

Não precisa de `npm install`: o protótipo usa só recursos nativos do Node.js e do
navegador, sem bibliotecas externas nem etapa de build. Abrir uma segunda aba cria
outro jogador real no mesmo mapa, para testar o multiplayer.

## Controles

| Ação | Tecla |
| --- | --- |
| Mover | WASD / setas / clique no chão / direcional de toque |
| Ataque básico | Espaço |
| Kamehameha · Kaioken · Barreira · Genki Dama | 1 · 2 · 3 · 5 |
| Super Saiyajin | 4 ou T |
| Esquiva | Shift |
| Comida · Poção de Ki · Semente | F · Q · R |
| Iniciar/pausar caça automática | H |

Os detalhes completos estão em [`LEIA_PRIMEIRO.md`](LEIA_PRIMEIRO.md).

## Estrutura do projeto

```
public/
├─ shared/     regras do jogo (config, math, characters, enemies, game)
├─ client/     interface, controles e renderização
├─ art/        desenho por personagem/cenário (goku, freeza, terrain, ...)
├─ render/     câmera, zoom e animação
└─ assets/     sprites e texturas (PNG)
server.mjs     servidor HTTP local
tests/         testes automáticos
```

Como não há empacotador, o navegador carrega os módulos direto pela URL; por isso
todo código compartilhado fica dentro de `public/`.

## Desenvolvimento

- Rodar os testes: `npm test`
- Conferir a sintaxe dos módulos: `npm run check`
- Prévia das animações: com o servidor ligado, abra `http://localhost:3000/animacoes.html`

## Contribuindo (passo a passo)

Somos um time de 4 devs. A regra de ouro: **ninguém faz push direto na `main`** —
cada mudança entra por branch + Pull Request, pra ninguém quebrar o trabalho do outro.

### Uma vez só (cada dev)

```bash
git clone https://github.com/pedrohenriqueballesta-ux/dragon-ball-idle.git
cd dragon-ball-idle
```

### Toda vez que for trabalhar

**1. Pegue a versão mais nova** (o que os outros já enviaram):

```bash
git checkout main
git pull
```

**2. Crie uma branch só sua**, com um nome do que vai fazer (ex.: `arrumar-goku`):

```bash
git checkout -b minha-mudanca
```

**3. Mexa no código.** Ao terminar um pedaço, salve (pode repetir quantas vezes quiser):

```bash
git add .
git commit -m "descreva o que fez"
```

**4. Antes de enviar, confira que não quebrou nada:**

```bash
npm run check
npm test
```

**5. Envie sua branch pro GitHub:**

```bash
git push -u origin minha-mudanca
```

**6. Abra o Pull Request:** no site do repositório, clique no aviso amarelo
**"Compare & pull request"** (ou aba **Pull requests** → **New pull request**,
com **base** = `main` e **compare** = sua branch) → **Create pull request**.

**7. Juntar:** outro dev revisa e alguém clica no botão verde **Merge**.
Sua mudança entra na `main` pra todo mundo.

**8. Próxima tarefa?** Volte ao passo 1 (sempre com a `main` atualizada antes).

> Se terminal e comandos forem complicados pra alguém, dá pra usar o
> [GitHub Desktop](https://desktop.github.com/): ele faz clonar, branch, commit,
> push e abrir PR tudo por botões.

A versão mais detalhada deste guia também está em [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Status

Protótipo em desenvolvimento. Ainda não há contas de produção, comércio entre
jogadores, todas as classes nem publicação na internet. Vários números são
provisórios e podem mudar (ver `LEIA_PRIMEIRO.md`).
