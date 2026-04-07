-- ============================================================
-- TABELA: pedidos
-- ============================================================
CREATE TABLE pedidos (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  usuario_id       INT UNSIGNED    NOT NULL,

  -- Logística
  modalidade       ENUM('entrega', 'retirada') NOT NULL DEFAULT 'entrega',
  endereco_id      INT UNSIGNED    NULL,          -- FK → enderecos; NULL quando retirada
  horario_retirada VARCHAR(5)      NULL,          -- Ex: "14:30" (apenas para retirada)

  -- Financeiro
  valor_subtotal   DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  desconto         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  valor_frete      DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  valor_total      DECIMAL(10,2)   NOT NULL DEFAULT 0.00,

  -- Pagamento e status
  status           ENUM('pendente','pago','enviado','entregue','cancelado') NOT NULL DEFAULT 'pendente',
  metodo_pagamento ENUM('pix','dinheiro','cartao_credito','boleto') NULL,
  codigo_rastreio  VARCHAR(100)    NULL,

  criado_em        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_pedidos_usuario  (usuario_id),
  KEY idx_pedidos_endereco (endereco_id),
  KEY idx_pedidos_status   (status),
  KEY idx_pedidos_criado   (criado_em),

  CONSTRAINT fk_pedidos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_pedidos_endereco
    FOREIGN KEY (endereco_id) REFERENCES enderecos (id)
    ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABELA: itens_pedido
-- Snapshot do produto no momento da compra.
-- ============================================================
CREATE TABLE itens_pedido (
  id             INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  pedido_id      INT UNSIGNED      NOT NULL,
  produto_id     INT UNSIGNED      NULL,          -- FK → catalogo (nullable)

  nome_produto   VARCHAR(100)      NOT NULL,      -- marca
  sabor          VARCHAR(100)      NOT NULL,
  tamanho        VARCHAR(50)       NOT NULL,

  valor_unitario DECIMAL(10,2)     NOT NULL,
  quantidade     SMALLINT UNSIGNED NOT NULL DEFAULT 1,

  PRIMARY KEY (id),
  KEY idx_itens_pedido_id  (pedido_id),
  KEY idx_itens_produto_id (produto_id),

  CONSTRAINT fk_itens_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_itens_catalogo
    FOREIGN KEY (produto_id) REFERENCES catalogo (id)
    ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SHOW COLUMNS FROM pedidos;
SHOW COLUMNS FROM itens_pedido;
