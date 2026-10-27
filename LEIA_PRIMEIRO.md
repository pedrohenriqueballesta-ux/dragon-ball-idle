# Dragon Ball Idle — protótipo visual 0.3

Esta versão acrescenta passos animados e poses de ataque ao Goku e aos inimigos, caminhos com curvas, pedras ajustadas, barra de habilidades menor e zoom. O projeto continua com um mapa de teste, Goku, combate, caça automática e um servidor multiplayer local.

## Como atualizar a versão anterior sem perder o progresso

1. No jogo aberto, clique em **Salvar progresso**. Na janela preta do servidor, pressione **Ctrl+C** para encerrá-lo.
2. Extraia o ZIP novo em uma pasta separada da versão anterior.
3. Na pasta da versão anterior, entre em **data** e copie o arquivo **save.json**. Na pasta nova, crie uma pasta chamada **data** se ainda não existir e cole o arquivo nela.
4. Abra **INICIAR_WINDOWS.bat** na pasta nova. Mantenha a janela preta aberta e acesse http://localhost:3000 no mesmo navegador usado anteriormente. Atualize a página.

O ZIP não contém o progresso do seu computador. O arquivo save.json e a sessão do navegador permitem recuperar o personagem ao usar o mesmo endereço local.

## Como executar no Windows ou Mac

1. Instale Node.js 22 ou superior, caso ainda não tenha. O instalador está em https://nodejs.org/ .
2. Extraia o ZIP inteiro. Evite executar arquivos diretamente de dentro do ZIP.
3. Abra o Terminal na pasta dragon-ball-idle, onde está package.json.
4. Execute npm start.
5. Abra http://localhost:3000 no navegador.

Não é necessário executar npm install. Este protótipo usa somente recursos nativos do Node.js e do navegador, sem pacotes externos.

Você também pode iniciar pelo INICIAR_WINDOWS.bat. No Mac, rode npm start pelo Terminal; INICIAR_MAC.command é uma alternativa se o sistema permitir sua execução.

Para encerrar, pressione Ctrl+C no Terminal. O progresso fica no arquivo data/save.json. Reabrir a página no mesmo navegador permite continuar a última sessão disponível. Cada aba adicional conectada ganha outro personagem para testar o multiplayer.

## Controles

| Ação | Controle |
| --- | --- |
| Mover | WASD, setas, clique no chão ou direcional de toque |
| Aproximar / afastar | Roda do mouse sobre o mapa ou botões + / − junto ao minimapa |
| Selecionar alvo | Clique no mob ou em outro jogador |
| Ataque básico | 1 ou botão Combo |
| Rajada de Ki | 2, disponível no nível 2 |
| Kamehameha | 3, disponível no nível 3 |
| Imagem Residual | 4 ou Espaço, disponível no nível 2 |
| Transformar | T, disponível no nível 5 |
| Comer | F |
| Poção de Ki | Q |
| Semente selecionada | R |
| Iniciar/pausar caça | H ou botão no painel |

O botão **Personagem e caça** no cabeçalho abre o painel de status, inventário e configurações. O botão **Caça · H** no mapa inicia ou pausa a caça. No celular, use os botões e o direcional.

O Goku, o Saibaman e a sentinela alienígena usam dois quadros alternados de caminhada com orientação de frente, costas e laterais; o Super Saiyajin também. O ataque básico tem duas poses de golpe, e os inimigos apresentam preparação e ataque durante seus avisos de combate. Ações mais complexas e animações com mais quadros ainda podem ser desenvolvidas.

## Roteiro para o primeiro teste

1. Entre com um nome e confira a vida, o Ki e o peso inicial da mochila.
2. Ative a caça nos Campos da Terra. Ela liga os ataques automáticos e as técnicas disponíveis. A comida é renovada automaticamente quando autorizada e houver estoque.
3. Ao chegar ao nível 2, use a Imagem Residual para sair dos círculos vermelhos anunciados pelos inimigos.
4. No nível 3, experimente alinhar o Kamehameha. O ataque é direcional e tem preparação.
5. Após sofrer dano, use uma semente. Tente trocar a potência durante os 20 segundos de recarga: todas continuam bloqueadas.
6. Abra outra aba para ver um segundo jogador real. Leve ambos para a Fronteira de Combate para testar o PvP. Fora dela, o servidor recusa dano entre jogadores.
7. Volte ao mercador da vila, venda materiais e reponha comida e poções.

Os botões Vila / mercado e Fronteira PvP fazem o personagem caminhar até a região. Movimentar manualmente interrompe a condução automática.

## Dois computadores ou celular na mesma rede

Para permitir conexões da sua rede, inicie com npm start -- --host 0.0.0.0 . No outro dispositivo, abra http://IP-DO-SEU-COMPUTADOR:3000 . Substitua o IP pelo endereço local do computador que está rodando o servidor. O firewall pode exigir liberação dessa conexão local.

O servidor padrão aceita conexões apenas do próprio computador. Esta entrega não publica um servidor na internet.

## O que está implementado

- Mundo 2D visto de cima, movimentação por teclado e toque e personagens reais compartilhando o mapa.
- Goku com ataques manuais e automáticos, caça por região e técnicas desbloqueadas por nível.
- Crescimento automático de vida, Ki, ataque, defesa, cura, capacidade em peso, chance de loot e mobilidade.
- Comida com efeito temporário de recuperação, sem regeneração gratuita de vida fora do efeito.
- Sementes de 15%, 30%, 50% e 100% da vida máxima, com recarga compartilhada.
- Poções de Ki, inventário com peso, coleta de materiais, Zeni e um mercado de NPC.
- Regiões PvE, área específica de PvP e um chefe na Cratera Rubra.
- Simulação e validação de ações no servidor, inclusive dano, experiência, estoque e recarga.
- Salvamento local do servidor. A caça é suspensa se a sessão desconectar.

## Decisões provisórias usadas para viabilizar o teste

Os números e comportamentos abaixo foram escolhidos para o protótipo e podem ser alterados. Eles não substituem nossas decisões futuras de design.

| Regra | Valor de teste |
| --- | --- |
| Duração da comida | 300 segundos |
| Cura por comida | 2 de vida/s, multiplicados pelo atributo Cura |
| Acumulação de comida | Um efeito ativo por vez |
| Comida em combate | Continua funcionando |
| Recarga das sementes | 20 segundos para toda a categoria |
| Referência da semente | Percentual da vida máxima, limitado à vida máxima |
| Poção de Ki | 45% do Ki máximo; recarga de 8 segundos |
| Ki em repouso | Recuperação lenta, fora da caça e dos ataques |
| Rajada e esquiva | Nível 2 |
| Kamehameha | Nível 3 |
| Super Saiyajin | Nível 5, com consumo de Ki |
| Morte | Retorna à vila sem perder XP |
| Mochila cheia | Continua recebendo XP; itens que não cabem ficam no chão |
| Loot | Prioridade ao responsável pela derrota durante 15 segundos |
| Mercado | Vendedor de NPC; sementes fortes são caras |
| Kit inicial | Consumíveis gratuitos para experimentar as regras |

O protótipo tem apenas Goku e um mapa pequeno. Ainda não há contas de produção, comércio entre jogadores, todas as classes, mundo completo ou infraestrutura de publicação. O nome de jogador é uma identificação de teste, não uma conta autenticada.

## Estrutura do código

- server.mjs: servidor HTTP, conexão de jogadores, transmissão de estado e salvamento.
- public/shared/: regras autoritativas, compartilhadas pelo servidor e pelo navegador.
  - config.mjs: mundo, zonas, obstáculos e números de balanceamento (ajustáveis).
  - math.mjs: funções matemáticas puras (distância, normalização, etc.).
  - characters.mjs: personagem jogável (Goku), progressão e inventário inicial.
  - enemies.mjs: atributos dos inimigos e onde eles nascem no mapa.
  - game.mjs: a classe Game — combate, movimento, inventário e tick do mundo.
  - index.mjs: ponto de entrada que reúne o que o servidor e o cliente importam.
- public/client/game.mjs: interface, controles, desenho do mapa e sprites de reserva.
- public/art/: desenho separado por assunto (terrain, goku, saibaman, alien, atlas, assets) + index.mjs.
- public/render/camera.mjs: zoom, câmera, mira no mapa e seleção de quadros de movimento.
- public/assets/: sprites e texturas em PNG.
- public/style.css: apresentação e adaptação para telas pequenas.
- tests/game.test.mjs: testes das regras e de duas conexões reais.
- tests/view.test.mjs: testes da câmera e dos quadros de animação.
- docs/CONCEITO.md: cópia das decisões do projeto no momento desta entrega.

Regra importante: como o projeto não usa empacotador, o navegador carrega os módulos
direto pela URL. Por isso todo código compartilhado fica dentro de public/.

As tecnologias Phaser + TypeScript e Colyseus foram recomendações iniciais. Para entregar um teste local sem instalação de bibliotecas, esta versão usa Canvas 2D e Node.js com módulos JavaScript. O código de regras está separado da apresentação para permitir uma migração futura se ela se mostrar útil.

## Verificação

Execute npm test para verificar as regras e a conexão de dois jogadores. Execute npm run check para verificar a sintaxe dos módulos.

O servidor transmite o estado para o navegador e calcula as regras. A primeira validação envolve duas sessões; capacidade de jogadores em produção ainda precisa de testes próprios.
