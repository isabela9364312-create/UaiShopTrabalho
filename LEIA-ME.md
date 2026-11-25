# UaiShop — Hortifrúti mineiro

Marketplace de frutas, verduras, legumes e grãos, direto do produtor.
Protótipo feito em HTML, CSS e JavaScript puro (sem instalar nada para abrir).

## Como abrir

**Jeito mais fácil:** dê dois cliques no arquivo `index.html`.
Ele abre no navegador (Chrome, Edge, Firefox...).

Também tem a **versão de arquivo único** em `versao-arquivo-unico/uaishop.html`:
é o mesmo site, com tudo dentro de um arquivo só. Bom para mandar por WhatsApp ou e-mail.

> Precisa de internet só para carregar as letras (fontes do Google). Sem internet, o site funciona com a letra padrão do computador.

## Contas de demonstração (senha `123`)

| Usuário | Entra como |
|---|---|
| `admin` | Administrador |
| `consumidor` | Cliente (Ana Souza) |
| `produtor` | Produtor (Hortifrúti do Carlos) |
| `produtor2` | Produtor (Quitanda da Bia) |
| `produtor3` | Produtor (Sítio Boa Vista) |
| `maria` | Pedido para vender **esperando aprovação** |
| `pedro` | Pedido para vender **esperando aprovação** (não cumpre as regras) |

Na tela de login, o botão **"Restaurar os dados de demonstração"** apaga tudo o que foi testado e volta ao começo. Use antes de apresentar.

## O que o sistema faz

- **Cliente:** cria conta, busca e ordena produtos, compra por kg (de meio em meio quilo), maço, dúzia etc., finaliza com entrega e pagamento (simulado), acompanha o pedido, cancela antes de sair para entrega, pede devolução em até 7 dias e avalia os produtos.
- **Produtor:** pede para vender (com a lista do que tem e quanto tem), cadastra produtos com foto, muda o estoque direto na tabela, registra pedidos feitos por telefone/WhatsApp/banca, envia pedidos, responde avaliações e devoluções, edita os dados da loja.
- **Administração:** aprova quem pode ser produtor (com regras de mínimo de produtos e estoque), acompanha pedidos, devoluções, produtos, usuários e avaliações (pode ocultar as ofensivas), vê relatórios por mês e por produtor e copia planilhas para o Excel.

## Pastas e arquivos

```
uaishop/
├── index.html                  → a página (estrutura)
├── css/estilos.css             → aparência: cores, tamanhos, tema escuro
├── js/app.js                   → toda a lógica: telas, regras, dados
├── versao-arquivo-unico/
│   └── uaishop.html            → o site inteiro num arquivo só
├── testes/
│   ├── teste-telas.js          → percorre as telas como admin, cliente e produtor
│   ├── teste-armazenamento-bloqueado.js → confere que o site abre mesmo com o navegador bloqueando o armazenamento
│   └── package.json
└── LEIA-ME.md                  → este arquivo
```

### Como o `js/app.js` está organizado (procure pelos títulos `// =====`)

1. **Dados de exemplo e "versões" dos dados** (`DADOS: ...`): cada versão atualiza os dados antigos salvos no navegador sem perder nada.
2. **AUTH**: login, senhas (guardadas como *hash*, um "embaralhamento" que não dá para desfazer), sessão.
3. **Telas do cliente** (`CONSUMER`), **cadastros**, **cancelamento e devolução**, **avaliações**.
4. **Telas do produtor** (`PRODUCER`).
5. **Telas da administração** (`ADMIN`).

## Como rodar os testes (opcional)

Precisa do [Node.js](https://nodejs.org) instalado.

```bash
cd testes
npm install
npm test
```

O teste abre o site num navegador simulado e clica em tudo sozinho. No fim aparece `NENHUM PROBLEMA` ou a lista do que falhou.

## Limitações (importante saber)

- **Os dados ficam no navegador de quem usa.** Uma compra feita no celular do cliente **não aparece** no computador do produtor. Para virar um site de verdade, os dados precisam ir para um servidor (por exemplo Node.js + PostgreSQL, ou Supabase).
- **O login é de demonstração.** Como tudo roda no navegador, alguém com conhecimento técnico consegue contorná-lo. A checagem de senha precisa ficar no servidor.
- **O pagamento é simulado.** Não use dados de cartão de verdade. Só os 4 últimos números ficam guardados.
- **Preços, avaliações e pedidos de exemplo são fictícios.**

---
Feito por TechDevs · Minas Gerais · 2026
