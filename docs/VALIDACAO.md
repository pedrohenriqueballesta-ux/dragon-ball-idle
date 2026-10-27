# Estado da entrega — protótipo 0.1

Data: 27 de outubro de 2026.

## Resultado

Projeto local executado com Node.js 24.22.1. Sem dependências externas. Requisito declarado para o usuário: Node.js 22 ou superior.

Os comandos npm run check e npm test passaram. Foram dez testes:

1. Cooldown compartilhado entre potências de semente, sem perda de item em tentativa bloqueada.
2. Regeneração apenas com comida ativa e término do efeito.
3. Crescimento automático dos atributos e desbloqueio por nível.
4. Bloqueio de PvP fora da região e permissão dentro dela.
5. Kamehameha que cruza a fronteira respeita a regra de PvP.
6. Capacidade de mochila e compra bloqueada sem gasto.
7. Entrada manual encerra a caça; desconexão suspende a recuperação/atividade do personagem.
8. Transformação exige nível e termina quando o Ki acaba.
9. Caça automática de um minuto derrota mobs e evolui sem comandos adicionais.
10. Duas conexões reais recebem o mundo compartilhado; entradas não podem escrever atributos diretamente.

## Navegador

A interface foi aberta no Chrome. Duas abas mostraram dois jogadores conectados. A primeira sessão evoluiu do nível 1 ao 7 durante a verificação. Foram observados:

- Caça automática, ganho de experiência e aumento dos status.
- Interrupção da caça com tecla de movimento.
- Uso de semente e seleção de outra potência permanecendo em recarga.
- Compra de presunto no mercado: estoque passou de 5 para 6 e Zeni de 200 para 188.
- Recuperação da sessão e do nível após recarregar a página.

Não houve teste em celular físico nem teste de carga para produção. Os controles de toque e o layout responsivo estão implementados.

## Escopo

Um personagem, um mapa pequeno e valores de teste. Não há contas de produção nem comércio entre jogadores. A entrega é local e inclui o código para desenvolver os próximos sistemas.


## Atualização visual 0.2

- `npm run check` e `npm test`: aprovados, incluindo as dez verificações de regras e sessões reais.
- Navegador desktop: artes e mapa renderizados; painel de personagem, caça automática, retomada manual, poção de Ki e transformação Super Saiyajin verificados.
- A animação usa poses isoladas da folha adaptada com um movimento simples; não é uma animação quadro a quadro completa em oito direções.
- O teste visual não usou aparelho físico de toque.

## Atualização visual 0.3

- `npm run check` e 13 testes automatizados passaram. As novas verificações cobrem zoom, limites da câmera, cálculo da mira e seleção de quadros.
- Navegador desktop: roda do mouse aproximou e afastou; botões de zoom funcionaram; um Saibaman foi selecionado por clique com o zoom em 120%.
- Foram observados passos e mudança de direção do Goku e mobs, caminhos arredondados, pedras junto ao chão, caça e barra de habilidades compacta.
- O salvamento da versão 0.2 foi recuperado na 0.3 em teste local, preservando nível, XP e inventário.
- Não houve teste em aparelho físico de toque. Os ciclos de caminhada e ataque são de dois quadros por direção; outros movimentos ainda podem receber mais quadros.
