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

## Contribuindo

Somos um time de 4 devs. **Ninguém faz push direto na `main`**: cada mudança entra
por branch + Pull Request. O passo a passo está em [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Status

Protótipo em desenvolvimento. Ainda não há contas de produção, comércio entre
jogadores, todas as classes nem publicação na internet. Vários números são
provisórios e podem mudar (ver `LEIA_PRIMEIRO.md`).
