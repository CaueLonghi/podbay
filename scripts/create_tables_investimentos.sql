-- ============================================================
-- INVESTIMENTOS
-- ============================================================
CREATE TABLE investimentos (
  id          SERIAL          PRIMARY KEY,
  descricao   VARCHAR(255),
  valor       DECIMAL(10,2)   NOT NULL,
  data        DATE            NOT NULL DEFAULT CURRENT_DATE,
  criado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CUSTOS MENSAIS (despesas fixas/variáveis por mês)
-- ============================================================
CREATE TABLE custos_mensais (
  id          SERIAL          PRIMARY KEY,
  descricao   VARCHAR(255)    NOT NULL,
  valor       DECIMAL(10,2)   NOT NULL,
  mes         SMALLINT        NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano         SMALLINT        NOT NULL,
  criado_em   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AGIOTAGEM (dívidas a receber)
-- ============================================================
CREATE TABLE agiotagem (
  id               SERIAL          PRIMARY KEY,
  nome             VARCHAR(255)    NOT NULL,
  valor_emprestado DECIMAL(10,2)   NOT NULL,
  valor_total      DECIMAL(10,2)   NOT NULL,
  num_parcelas     SMALLINT        NOT NULL DEFAULT 1,
  criado_em        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE agiotagem_parcelas (
  id              SERIAL          PRIMARY KEY,
  agiotagem_id    INTEGER         NOT NULL REFERENCES agiotagem(id) ON DELETE CASCADE,
  numero          SMALLINT        NOT NULL,
  valor           DECIMAL(10,2)   NOT NULL,
  pago            BOOLEAN         NOT NULL DEFAULT FALSE,
  data_pagamento  DATE
);

CREATE INDEX idx_agiotagem_parcelas ON agiotagem_parcelas (agiotagem_id);
