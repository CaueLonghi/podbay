-- ============================================================
-- SEED: Pedidos de exemplo para testar a aba de Vendas.
-- Usa usuario_id = 1. Enderecos precisam existir na tabela enderecos.
-- Ajuste os IDs de endereco_id conforme os dados reais do banco.
-- Para pedidos de retirada, endereco_id = NULL.
-- ============================================================

-- Descobre o primeiro endereco do usuario 1 (usado nos pedidos de entrega)
SET @end1 = (SELECT id FROM enderecos WHERE usuario_id = 1 ORDER BY principal DESC, id ASC LIMIT 1);

-- ── PEDIDO 1: Pendente / Entrega ─────────────────────────────
INSERT INTO pedidos
  (usuario_id, modalidade, endereco_id, valor_subtotal, desconto, valor_frete, valor_total, status, metodo_pagamento, criado_em)
VALUES
  (1, 'entrega', @end1, 139.80, 0.00, 12.00, 151.80, 'pendente', 'pix', NOW() - INTERVAL 10 MINUTE);
SET @p1 = LAST_INSERT_ID();
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p1, id, marca, sabor, tamanho, valor, 2 FROM catalogo WHERE ativo = 1 LIMIT 1;
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p1, id, marca, sabor, tamanho, valor, 1 FROM catalogo WHERE ativo = 1 LIMIT 1 OFFSET 1;

-- ── PEDIDO 2: Pendente / Retirada ────────────────────────────
INSERT INTO pedidos
  (usuario_id, modalidade, endereco_id, horario_retirada, valor_subtotal, desconto, valor_frete, valor_total, status, metodo_pagamento, criado_em)
VALUES
  (1, 'retirada', NULL, '14:30', 89.90, 10.00, 0.00, 79.90, 'pendente', 'pix', NOW() - INTERVAL 25 MINUTE);
SET @p2 = LAST_INSERT_ID();
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p2, id, marca, sabor, tamanho, valor, 1 FROM catalogo WHERE ativo = 1 LIMIT 1 OFFSET 2;

-- ── PEDIDO 3: Pago / Entrega ─────────────────────────────────
INSERT INTO pedidos
  (usuario_id, modalidade, endereco_id, valor_subtotal, desconto, valor_frete, valor_total, status, metodo_pagamento, criado_em)
VALUES
  (1, 'entrega', @end1, 179.70, 0.00, 15.00, 194.70, 'pago', 'cartao_credito', NOW() - INTERVAL 2 HOUR);
SET @p3 = LAST_INSERT_ID();
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p3, id, marca, sabor, tamanho, valor, 3 FROM catalogo WHERE ativo = 1 LIMIT 1 OFFSET 3;
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p3, id, marca, sabor, tamanho, valor, 1 FROM catalogo WHERE ativo = 1 LIMIT 1 OFFSET 4;

-- ── PEDIDO 4: Pago / Retirada ────────────────────────────────
INSERT INTO pedidos
  (usuario_id, modalidade, endereco_id, horario_retirada, valor_subtotal, desconto, valor_frete, valor_total, status, metodo_pagamento, criado_em)
VALUES
  (1, 'retirada', NULL, '10:00', 59.90, 0.00, 0.00, 59.90, 'pago', 'pix', NOW() - INTERVAL 5 HOUR);
SET @p4 = LAST_INSERT_ID();
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p4, id, marca, sabor, tamanho, valor, 1 FROM catalogo WHERE ativo = 1 LIMIT 1 OFFSET 5;

-- ── PEDIDO 5: Enviado / Entrega ──────────────────────────────
INSERT INTO pedidos
  (usuario_id, modalidade, endereco_id, valor_subtotal, desconto, valor_frete, valor_total, status, metodo_pagamento, codigo_rastreio, criado_em)
VALUES
  (1, 'entrega', @end1, 239.60, 20.00, 0.00, 219.60, 'enviado', 'pix', 'BR123456789BR', NOW() - INTERVAL 1 DAY);
SET @p5 = LAST_INSERT_ID();
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p5, id, marca, sabor, tamanho, valor, 2 FROM catalogo WHERE ativo = 1 LIMIT 1 OFFSET 6;
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p5, id, marca, sabor, tamanho, valor, 2 FROM catalogo WHERE ativo = 1 LIMIT 1 OFFSET 7;

-- ── PEDIDO 6: Entregue / Entrega ─────────────────────────────
INSERT INTO pedidos
  (usuario_id, modalidade, endereco_id, valor_subtotal, desconto, valor_frete, valor_total, status, metodo_pagamento, codigo_rastreio, criado_em)
VALUES
  (1, 'entrega', @end1, 119.80, 0.00, 12.00, 131.80, 'entregue', 'cartao_credito', 'BR987654321BR', NOW() - INTERVAL 3 DAY);
SET @p6 = LAST_INSERT_ID();
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p6, id, marca, sabor, tamanho, valor, 2 FROM catalogo WHERE ativo = 1 LIMIT 1 OFFSET 8;

-- ── PEDIDO 7: Entregue / Retirada ────────────────────────────
INSERT INTO pedidos
  (usuario_id, modalidade, endereco_id, horario_retirada, valor_subtotal, desconto, valor_frete, valor_total, status, metodo_pagamento, codigo_rastreio, criado_em)
VALUES
  (1, 'retirada', NULL, '16:00', 89.90, 5.00, 0.00, 84.90, 'entregue', 'boleto', 'BR112233445BR', NOW() - INTERVAL 7 DAY);
SET @p7 = LAST_INSERT_ID();
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p7, id, marca, sabor, tamanho, valor, 1 FROM catalogo WHERE ativo = 1 LIMIT 1 OFFSET 9;
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p7, id, marca, sabor, tamanho, valor, 1 FROM catalogo WHERE ativo = 1 LIMIT 1 OFFSET 10;

-- ── PEDIDO 8: Cancelado / Entrega ────────────────────────────
INSERT INTO pedidos
  (usuario_id, modalidade, endereco_id, valor_subtotal, desconto, valor_frete, valor_total, status, metodo_pagamento, criado_em)
VALUES
  (1, 'entrega', @end1, 59.90, 0.00, 12.00, 71.90, 'cancelado', 'pix', NOW() - INTERVAL 5 DAY);
SET @p8 = LAST_INSERT_ID();
INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, sabor, tamanho, valor_unitario, quantidade)
SELECT @p8, id, marca, sabor, tamanho, valor, 1 FROM catalogo WHERE ativo = 1 LIMIT 1 OFFSET 11;


-- ── VERIFICAÇÃO ──────────────────────────────────────────────
SELECT
  p.id,
  u.username,
  p.modalidade,
  COALESCE(CONCAT(e.logradouro, ', ', e.numero), 'Retirada ' || p.horario_retirada) AS destino,
  p.status,
  p.valor_total,
  COUNT(i.id) AS qtd_itens,
  p.criado_em
FROM pedidos p
JOIN usuarios u ON u.id = p.usuario_id
LEFT JOIN enderecos e ON e.id = p.endereco_id
LEFT JOIN itens_pedido i ON i.pedido_id = p.id
GROUP BY p.id
ORDER BY p.criado_em DESC;
