-- =============================================================
-- PODBAY — Script de criação do banco de dados
-- MySQL 8.0+
-- =============================================================

USE podbay_db;

-- =============================================================
-- 1. USUARIOS
-- =============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)     NOT NULL,
  nome_completo VARCHAR(200)    NOT NULL DEFAULT '',
  email         VARCHAR(150)    NOT NULL,
  telefone      VARCHAR(20)     NULL,
  password_hash VARCHAR(255)    NOT NULL,  -- bcrypt ($2b$10$...)
  is_admin      TINYINT(1)      NOT NULL DEFAULT 0,
  ativo         TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username),
  UNIQUE KEY uq_email (email),
  UNIQUE KEY uq_telefone (telefone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Se a tabela já existe, adicione as colunas manualmente:
-- ALTER TABLE usuarios ADD COLUMN nome_completo VARCHAR(200) NOT NULL DEFAULT '' AFTER username;
-- ALTER TABLE usuarios ADD COLUMN telefone VARCHAR(20) NULL UNIQUE AFTER email;

-- =============================================================
-- 2. CATALOGO
-- =============================================================
CREATE TABLE IF NOT EXISTS catalogo (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  marca         VARCHAR(100)    NOT NULL,
  sabor         VARCHAR(150)    NOT NULL,
  tamanho       VARCHAR(30)     NOT NULL,  -- ex: "2ml", "5ml", "10ml", "30ml"
  valor         DECIMAL(10, 2)  NOT NULL,
  estoque       INT UNSIGNED    NOT NULL DEFAULT 0,
  emoji         VARCHAR(10)     NULL,      -- emoji exibido no app
        ENUM('pods','bateria','liquido','acessorio') NOT NULL DEFAULT 'pods',
  ativo         TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_  ( ),
  KEY idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- 3. ENDERECOS
-- =============================================================
CREATE TABLE IF NOT EXISTS enderecos (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  usuario_id    INT UNSIGNED    NOT NULL,
  apelido       VARCHAR(50)     NULL,      -- ex: "Casa", "Trabalho"
  cep           CHAR(9)         NOT NULL,  -- formato: 00000-000
  logradouro    VARCHAR(200)    NOT NULL,
  numero        VARCHAR(20)     NOT NULL,
  complemento   VARCHAR(100)    NULL,
  bairro        VARCHAR(100)    NOT NULL,
  cidade        VARCHAR(100)    NOT NULL,
  estado        CHAR(2)         NOT NULL,
  principal     TINYINT(1)      NOT NULL DEFAULT 0,  -- endereço padrão do usuário
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_usuario (usuario_id),
  CONSTRAINT fk_enderecos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- DADOS INICIAIS — USUARIOS
-- Senha de todos os usuários abaixo: admin
-- Hash gerado com bcrypt cost=10
-- =============================================================
INSERT INTO usuarios (username, email, password_hash, is_admin) VALUES
  ('admin', 'admin@podbay.com', '$2b$10$5aGGgjc7wlEwN6pexw8mDOKuhX.pY/jjza2d0T6nv9tfsfCzBkx0m', 1),
  ('cliente1', 'cliente1@email.com', '$2b$10$5aGGgjc7wlEwN6pexw8mDOKuhX.pY/jjza2d0T6nv9tfsfCzBkx0m', 0),
  ('cliente2', 'cliente2@email.com', '$2b$10$5aGGgjc7wlEwN6pexw8mDOKuhX.pY/jjza2d0T6nv9tfsfCzBkx0m', 0);

-- =============================================================
-- DADOS INICIAIS — CATALOGO
-- =============================================================
INSERT INTO catalogo (marca, sabor, tamanho, valor, estoque, emoji,  ) VALUES
  -- Pods
  ('JUUL',        'Mint Fresco',     '0.7ml', 28.90, 50,  '❄️',  'pods'),
  ('JUUL',        'Berry Suave',     '0.7ml', 31.90, 40,  '🫐',  'pods'),
  ('RELX',        'Manga Gelada',    '1.9ml', 35.90, 30,  '🥭',  'pods'),
  ('RELX',        'Melancia Ice',    '1.9ml', 33.90, 35,  '🍉',  'pods'),
  ('Vaporesso',   'Menta Pura',      '2ml',   29.90, 60,  '🌿',  'pods'),

  -- Baterias
  ('SMOK',        'Ultra 1500mAh',   '—',     89.90, 20,  '⚡',  'bateria'),
  ('GeekVape',    'Turbo 2000mAh',   '—',     99.90, 15,  '🔋',  'bateria'),
  ('Vaporesso',   'Xtra Slim',       '—',     79.90, 25,  '🔌',  'bateria'),

  -- Líquidos
  ('Nasty Juice', 'Tropical Punch',  '30ml',  42.90, 45,  '🌴',  'liquido'),
  ('Nasty Juice', 'Strawberry Kiwi', '30ml',  39.90, 50,  '🍓',  'liquido'),
  ('BLVK',        'Peach Ice',       '60ml',  54.90, 30,  '🍑',  'liquido'),
  ('BLVK',        'Grape Freeze',    '60ml',  54.90, 28,  '🍇',  'liquido'),

  -- Acessórios
  ('Genérico',    'Case Protetor',   '—',     24.90, 80,  '📱',  'acessorio'),
  ('Anker',       'Carregador USB-C','—',     34.90, 60,  '🔌',  'acessorio'),
  ('Genérico',    'Lanyard Ajustável','—',    18.90, 100, '🔗',  'acessorio');

-- =============================================================
-- DADOS INICIAIS — ENDERECOS
-- =============================================================
INSERT INTO enderecos (usuario_id, apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal) VALUES
  (1, 'Escritório', '01310-100', 'Av. Paulista',       '1000', 'Sala 42',  'Bela Vista',  'São Paulo',       'SP', 1),
  (2, 'Casa',       '20040-020', 'Av. Rio Branco',     '156',  'Apto 301', 'Centro',      'Rio de Janeiro',  'RJ', 1),
  (3, 'Casa',       '30130-110', 'Av. Afonso Pena',    '807',  NULL,       'Centro',      'Belo Horizonte',  'MG', 1);
