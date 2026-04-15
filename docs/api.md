# PodBay — Documentação de API

Base URL: `https://podbay-dev.vercel.app`

Autenticação via cookie `httpOnly` (`podbay_session`) definido no login. Endpoints marcados com 🔒 exigem sessão autenticada. Endpoints marcados com 🛡️ exigem role `admin`.

---

## Autenticação

### `POST /api/auth/register`
Cria uma nova conta de usuário.

**Body**
```json
{
  "nome_completo": "João Silva",
  "email": "joao@email.com",
  "telefone": "11999999999",
  "password": "senha123"
}
```

**Resposta 200**
```json
{ "ok": true, "user": { "id": "1", "username": "joao", "role": "user" } }
```

**Erros:** `400` campos faltando / senha < 6 chars · `409` email ou telefone já cadastrado

---

### `POST /api/auth/login`
Autentica o usuário e define o cookie de sessão.

**Body**
```json
{ "username": "joao", "password": "senha123" }
```
> `username` aceita também o e-mail.

**Resposta 200**
```json
{ "ok": true, "user": { "id": "1", "username": "joao", "role": "user" } }
```

**Erros:** `400` campos faltando · `401` credenciais inválidas

---

### `POST /api/auth/logout`
Invalida a sessão do usuário.

**Resposta 200:** `{ "ok": true }`

---

## Usuário 🔒

### `GET /api/user/me`
Retorna os dados do usuário autenticado.

**Resposta 200**
```json
{
  "user": {
    "id": 1, "username": "joao", "nome_completo": "João Silva",
    "email": "joao@email.com", "telefone": "11999999999",
    "is_admin": false, "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

### `GET /api/user/enderecos`
Lista os endereços cadastrados do usuário. Retorna o principal primeiro.

**Resposta 200**
```json
{
  "enderecos": [
    {
      "id": 1, "apelido": "Casa", "cep": "04001-001",
      "logradouro": "Rua Exemplo", "numero": "123", "complemento": null,
      "bairro": "Centro", "cidade": "São Paulo", "estado": "SP", "principal": true
    }
  ]
}
```

---

### `POST /api/user/enderecos`
Cadastra um novo endereço. Se for o primeiro, é automaticamente definido como principal.

**Body**
```json
{
  "apelido": "Casa",
  "cep": "04001-001",
  "logradouro": "Rua Exemplo",
  "numero": "123",
  "complemento": "Apto 42",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "estado": "SP"
}
```

**Resposta 201:** `{ "ok": true, "id": 1 }`

---

### `PATCH /api/user/enderecos/:id`
Define o endereço como principal (desmarca os demais).

**Resposta 200:** `{ "ok": true }`

---

### `GET /api/user/pedidos`
Lista o histórico de pedidos do usuário (resumo).

**Resposta 200**
```json
{
  "pedidos": [
    {
      "id": 10, "status": "pago", "modalidade": "entrega",
      "valor_total": 95.00, "criado_em": "2025-04-14T20:00:00Z",
      "resumo_itens": "1x BlackSheep 40K ICE, 2x ElfBar 40K ICE KING"
    }
  ]
}
```

---

### `DELETE /api/user/pedidos/:id`
Cancela um pedido. Apenas pedidos com status `pendente` (dinheiro) podem ser cancelados.

**Resposta 200:** `{ "ok": true }`

**Erros:** `404` pedido não encontrado · `400` status não permite cancelamento

---

## Pedidos

### `POST /api/pedidos` 🔒
Cria um pedido com pagamento em **dinheiro** (retirada). Pedidos PIX são criados via `/api/pagamento/iniciar`.

**Body**
```json
{
  "modalidade": "retirada",
  "metodo_pagamento": "dinheiro",
  "endereco_id": null,
  "horario_retirada": "14:00",
  "valor_frete": 0,
  "itens": [
    {
      "produto_id": "5",
      "nome_produto": "BlackSheep",
      "sabor": "Ice",
      "tamanho": "40K",
      "valor_unitario": 45.00,
      "quantidade": 2
    }
  ]
}
```

**Resposta 200:** `{ "ok": true, "pedido_id": 10 }`

**Erros:** `400` validação · `409` já existe pedido pendente

---

### `GET /api/pedidos/pendente` 🔒
Verifica se o usuário possui algum pedido com status `pendente`.

**Resposta 200:** `{ "pendente": true }`

---

## Pagamento

### `POST /api/pagamento/iniciar` 🔒
Fluxo PIX/cartão. Valida cupom, salva sessão temporária e retorna o link de pagamento InfinitePay.

**Body**
```json
{
  "modalidade": "entrega",
  "endereco_id": 1,
  "horario_retirada": null,
  "valor_frete": 0,
  "cupom_codigo": "PROMO10",
  "itens": [
    {
      "produto_id": "5",
      "nome_produto": "BlackSheep",
      "sabor": "Ice",
      "tamanho": "40K",
      "valor_unitario": 45.00,
      "quantidade": 2
    }
  ]
}
```

**Resposta 200:** `{ "ok": true, "url": "https://checkout.infinitepay.io/..." }`

**Erros:** `400` validação · `409` cupom esgotado · `502` erro na InfinitePay

> Ao confirmar pagamento, o webhook cria o pedido com status `pago` e a sessão temporária é deletada.

---

### `POST /api/pagamento/webhook`
Recebe notificação da InfinitePay após pagamento. **Não requer autenticação** (chamado pela InfinitePay).

**Body (InfinitePay)**
```json
{
  "order_nsu": "cs_1713123456_42",
  "invoice_slug": "abc123",
  "transaction_nsu": "uuid",
  "receipt_url": "https://comprovante.infinitepay.io/...",
  "amount": 9000,
  "paid_amount": 9000,
  "capture_method": "pix"
}
```

**Comportamento:**
- `paid_amount >= amount` → cria pedido com status `pago`, salva `capture_method` em `metodo_pagamento`, deleta sessão
- Pagamento recusado → deleta sessão e reverte uso do cupom

**Resposta:** sempre `200 { "ok": true }` para evitar reenvios

---

### `GET /api/pagamento/status` 🔒
Consulta o status de um pagamento pelo `order_nsu` (usado pela página de confirmação).

**Query:** `?order_nsu=cs_1713123456_42`

**Resposta 200**
```json
{
  "status": "pago",
  "receipt_url": "https://comprovante.infinitepay.io/...",
  "transaction_nsu": "uuid",
  "valor_total": 90.00
}
```

> `status` pode ser `aguardando` (sessão existe mas webhook ainda não chegou), `pago`, ou `erro`.

---

### `POST /api/pagamento/criar` 🔒
Gera link InfinitePay para um pedido já existente no banco (uso interno / pedidos dinheiro que precisam de link avulso).

**Body:** `{ "pedido_id": 10 }`

**Resposta 200:** `{ "ok": true, "url": "https://checkout.infinitepay.io/..." }`

---

## Cupons

### `GET /api/cupom/validar` 🔒
Valida um código de cupom sem consumi-lo.

**Query:** `?codigo=PROMO10`

**Resposta 200 — válido**
```json
{ "valido": true, "valor": 10.00, "nome": "Promoção Lançamento" }
```

**Resposta 200 — inválido**
```json
{ "valido": false, "mensagem": "Cupom esgotado" }
```

---

## Frete

### `GET /api/frete/estimar` 🔒
Estima o frete via Uber Moto para um endereço cadastrado.

> ⚠️ Funcionalidade temporariamente desabilitada (`FRETE_HABILITADO = false`). Retorna `{ frete: 0 }` enquanto desabilitado.

**Query:** `?endereco_id=1`

**Resposta 200**
```json
{ "frete": 12.50, "produto": "Uber Moto", "distancia": 3.2 }
```

---

## Admin 🛡️

### `GET /api/admin/catalogo`
Lista todos os produtos do catálogo (ativos e inativos).

**Resposta 200:** `{ "produtos": [...] }`

---

### `POST /api/admin/catalogo`
Cria um novo produto no catálogo.

**Body**
```json
{
  "marca": "BlackSheep", "sabor": "Ice", "descricao": null,
  "tamanho": "40K", "valor": 45.00, "custo": 22.00,
  "estoque": 10, "emoji": "🐑"
}
```

**Resposta 201:** `{ "id": 5 }`

---

### `PATCH /api/admin/catalogo/:id`
Atualiza `estoque` ou flag `novo` de um produto.

**Body:** `{ "estoque": 5 }` ou `{ "novo": true }`

---

### `PUT /api/admin/catalogo/:id`
Substitui todos os campos de um produto.

---

### `DELETE /api/admin/catalogo/:id`
Desativa um produto (`ativo = false`). Não exclui do banco.

---

### `GET /api/admin/pedidos`
Lista todos os pedidos com itens, dados do usuário e endereço de entrega.

---

### `PATCH /api/admin/pedidos/:id`
Atualiza status ou código de rastreio de um pedido.

**Body:** `{ "status": "enviado", "codigo_rastreio": "BR123456789" }`

Status permitidos: `pendente`, `pago`, `enviado`, `entregue`, `cancelado`

---

### `GET /api/admin/faturamento`
Retorna métricas financeiras por período.

**Query:** `?periodo=mes_atual` — opções: `hoje`, `7dias`, `mes_atual`, `mes_passado`, `tudo`

**Resposta 200**
```json
{
  "total_vendas": 42,
  "faturamento": 3150.00,
  "total_frete": 180.00,
  "lucro": 1260.00
}
```

---

### `GET /api/admin/cupons`
Lista todos os cupons ordenados por data de criação.

**Resposta 200**
```json
{
  "cupons": [
    {
      "id": 1, "nome": "Lançamento", "codigo": "PROMO10",
      "valor": 10.00, "quantidade_total": 50, "quantidade_usada": 3,
      "ativo": true, "criado_em": "2025-04-14T00:00:00Z"
    }
  ]
}
```

---

### `POST /api/admin/cupons`
Cria um novo cupom. O código é convertido para maiúsculas automaticamente.

**Body**
```json
{
  "nome": "Lançamento",
  "codigo": "promo10",
  "valor": 10.00,
  "quantidade_total": 50
}
```

**Resposta 200:** `{ "ok": true, "id": 1 }`

---

### `PATCH /api/admin/cupons/:id`
Atualiza campos de um cupom (`ativo`, `nome`, `valor`, `quantidade_total`).

**Body:** `{ "ativo": false }`

---

### `DELETE /api/admin/cupons/:id`
Remove permanentemente um cupom.

---

### `GET /api/admin/investimentos`
Lista todos os aportes de capital registrados.

---

### `POST /api/admin/investimentos`
Registra um novo aporte.

**Body:** `{ "descricao": "Compra de estoque", "valor": 500.00, "data": "2025-04-14" }`

---

### `DELETE /api/admin/investimentos/:id`
Remove um aporte.

---

### `GET /api/admin/custos`
Lista os custos mensais fixos registrados.

---

### `POST /api/admin/custos`
Registra um custo mensal.

**Body:** `{ "descricao": "Aluguel", "valor": 800.00, "mes": 4, "ano": 2025 }`

---

### `DELETE /api/admin/custos/:id`
Remove um custo mensal.

---

### `GET /api/admin/agiotagem`
Lista todas as dívidas registradas com suas parcelas.

---

### `POST /api/admin/agiotagem`
Registra uma dívida e cria automaticamente as parcelas.

**Body**
```json
{
  "nome": "Empréstimo Banco X",
  "valor_emprestado": 1000.00,
  "valor_total": 1200.00,
  "num_parcelas": 6
}
```

---

### `DELETE /api/admin/agiotagem/:id`
Remove uma dívida e todas as suas parcelas.

---

### `PATCH /api/admin/agiotagem/:id/parcelas/:parcelaId`
Marca uma parcela como paga ou não paga.

**Body:** `{ "pago": true, "data_pagamento": "2025-04-14" }`
