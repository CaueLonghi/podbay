-- ============================================================
-- PODBAY — Script de criação do banco de dados
-- PostgreSQL 14+
-- ============================================================

-- ============================================================
-- TIPOS ENUM
-- ============================================================
CREATE TYPE pedido_modalidade AS ENUM ('entrega', 'retirada');
CREATE TYPE pedido_status     AS ENUM ('pendente', 'pago', 'enviado', 'entregue', 'cancelado');
CREATE TYPE pagamento_metodo  AS ENUM ('pix', 'dinheiro', 'cartao_credito', 'boleto');

-- ============================================================
-- FUNÇÃO auxiliar para atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. USUARIOS
-- ============================================================
CREATE TABLE usuarios (
  id            SERIAL          PRIMARY KEY,
  username      VARCHAR(50)     NOT NULL UNIQUE,
  nome_completo VARCHAR(200)    NOT NULL DEFAULT '',
  email         VARCHAR(150)    NOT NULL UNIQUE,
  telefone      VARCHAR(20)     UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  is_admin      BOOLEAN         NOT NULL DEFAULT false,
  ativo         BOOLEAN         NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. CATALOGO
-- ============================================================
CREATE TABLE catalogo (
  id            SERIAL          PRIMARY KEY,
  marca         VARCHAR(100)    NOT NULL,
  sabor         VARCHAR(150)    NOT NULL,
  descricao     TEXT,
  tamanho       VARCHAR(30)     NOT NULL,
  valor         DECIMAL(10,2)   NOT NULL,
  custo         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  estoque       INTEGER         NOT NULL DEFAULT 0,
  emoji         VARCHAR(10),
  ativo         BOOLEAN         NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_catalogo_ativo ON catalogo (ativo);

CREATE TRIGGER trg_catalogo_updated_at
  BEFORE UPDATE ON catalogo
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 3. ENDERECOS
-- ============================================================
CREATE TABLE enderecos (
  id            SERIAL          PRIMARY KEY,
  usuario_id    INTEGER         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  apelido       VARCHAR(50),
  cep           CHAR(9)         NOT NULL,
  logradouro    VARCHAR(200)    NOT NULL,
  numero        VARCHAR(20)     NOT NULL,
  complemento   VARCHAR(100),
  bairro        VARCHAR(100)    NOT NULL,
  cidade        VARCHAR(100)    NOT NULL,
  estado        CHAR(2)         NOT NULL,
  principal     BOOLEAN         NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enderecos_usuario ON enderecos (usuario_id);

CREATE TRIGGER trg_enderecos_updated_at
  BEFORE UPDATE ON enderecos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. PEDIDOS
-- ============================================================
CREATE TABLE pedidos (
  id               SERIAL            PRIMARY KEY,
  usuario_id       INTEGER           NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  modalidade       pedido_modalidade NOT NULL DEFAULT 'entrega',
  endereco_id      INTEGER           REFERENCES enderecos(id) ON DELETE SET NULL ON UPDATE CASCADE,
  horario_retirada VARCHAR(5),
  valor_subtotal   DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  desconto         DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  valor_frete      DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  valor_total      DECIMAL(10,2)     NOT NULL DEFAULT 0.00,
  status           pedido_status     NOT NULL DEFAULT 'pendente',
  metodo_pagamento pagamento_metodo,
  codigo_rastreio  VARCHAR(100),
  criado_em        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pedidos_usuario  ON pedidos (usuario_id);
CREATE INDEX idx_pedidos_endereco ON pedidos (endereco_id);
CREATE INDEX idx_pedidos_status   ON pedidos (status);
CREATE INDEX idx_pedidos_criado   ON pedidos (criado_em);

-- ============================================================
-- 5. ITENS_PEDIDO
-- ============================================================
CREATE TABLE itens_pedido (
  id             SERIAL          PRIMARY KEY,
  pedido_id      INTEGER         NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE ON UPDATE CASCADE,
  produto_id     INTEGER         REFERENCES catalogo(id) ON DELETE SET NULL ON UPDATE CASCADE,
  nome_produto   VARCHAR(100)    NOT NULL,
  sabor          VARCHAR(100)    NOT NULL,
  tamanho        VARCHAR(50)     NOT NULL,
  valor_unitario DECIMAL(10,2)   NOT NULL,
  custo_unitario DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  quantidade     SMALLINT        NOT NULL DEFAULT 1
);

CREATE INDEX idx_itens_pedido_id  ON itens_pedido (pedido_id);
CREATE INDEX idx_itens_produto_id ON itens_pedido (produto_id);
