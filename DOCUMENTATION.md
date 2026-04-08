# PODBAY — Documentação do Sistema

> Loja de vape mobile-first construída em Next.js 14 + TypeScript + MySQL

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [Banco de Dados](#banco-de-dados)
5. [Autenticação e Sessão](#autenticação-e-sessão)
6. [Rotas e Páginas](#rotas-e-páginas)
7. [APIs REST](#apis-rest)
8. [Componentes](#componentes)
9. [Contextos (State Management)](#contextos-state-management)
10. [Variáveis de Ambiente](#variáveis-de-ambiente)
11. [Scripts SQL](#scripts-sql)
12. [Como Executar](#como-executar)

---

## Visão Geral

PODBAY é um e-commerce mobile de vapes (pods, líquidos, baterias e acessórios). O sistema possui:

- Cadastro e autenticação de usuários com sessão persistente (7 dias)
- Catálogo de produtos agrupados por marca e tamanho
- Modal de sabores ao clicar em um grupo de produto
- Carrinho de compras persistido em localStorage
- Gerenciamento de endereços por usuário
- Logos de marcas exibidas nos cards de produto

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 14.2.35 |
| Linguagem | TypeScript | 5.x |
| UI | React | 18.x |
| Estilização | Tailwind CSS | 3.4.1 |
| Banco de Dados | MySQL via mysql2 | 3.20.0 |
| Hashing | bcryptjs | 3.0.3 |
| Ícones | Lucide React | 0.400.0 |
| Fonte | DM Sans | Google Fonts |
| Deploy | Vercel | — |

---

## Estrutura de Arquivos

```
c:\podbay\
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout raiz — providers + sessão do servidor
│   ├── page.tsx                  # Home — busca produtos no banco (Server Component)
│   ├── globals.css               # Estilos globais + variáveis CSS
│   ├── login/
│   │   └── page.tsx              # Tela de login
│   ├── register/
│   │   └── page.tsx              # Tela de cadastro
│   ├── profile/
│   │   └── page.tsx              # Perfil do usuário (Server Component)
│   ├── cart/
│   │   └── page.tsx              # Carrinho de compras
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts    # POST /api/auth/login
│       │   ├── logout/route.ts   # POST /api/auth/logout
│       │   └── register/route.ts # POST /api/auth/register
│       └── user/
│           ├── me/route.ts       # GET /api/user/me
│           └── enderecos/
│               ├── route.ts      # GET e POST /api/user/enderecos
│               └── [id]/route.ts # PATCH /api/user/enderecos/:id
│
├── components/
│   ├── HomeClient.tsx            # Listagem de produtos agrupados + modal de sabores
│   ├── ProfileClient.tsx         # UI do perfil + modal de novo endereço
│   ├── CartItem.tsx              # Item do carrinho com controle de quantidade
│   └── BottomNav.tsx             # Barra de navegação inferior
│
├── context/
│   ├── AuthContext.tsx           # Estado global de autenticação
│   ├── CartContext.tsx           # Estado do carrinho (localStorage)
│   └── ToastContext.tsx          # Sistema de notificações toast
│
├── lib/
│   ├── db.ts                     # Pool de conexão MySQL (singleton)
│   ├── auth.ts                   # validateCredentials()
│   ├── auth-config.ts            # Constantes de sessão (Edge-safe)
│   ├── session.ts                # getSessionUser() — lê cookie e consulta banco
│   └── catalogo.ts               # getProdutos() — query do catálogo
│
├── middleware.ts                 # Proteção de rotas (Edge Runtime)
├── public/
│   └── brands/                   # Logos das marcas
│       ├── blacksheep.png
│       ├── elf.png
│       ├── elfbar.png
│       ├── ignite.png
│       ├── lostmary.png
│       └── oxbar.png
├── scripts/
│   ├── podbay_db.sql             # Script de criação das tabelas
│   └── seed_catalogo.sql         # Seed completo do catálogo (96 produtos)
├── .env.local                    # Variáveis de ambiente (não versionado)
└── .gitignore
```

---

## Banco de Dados

### Tabela: `usuarios`

```sql
CREATE TABLE usuarios (
  id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)     NOT NULL UNIQUE,
  nome_completo VARCHAR(200)    NOT NULL DEFAULT '',
  email         VARCHAR(150)    NOT NULL UNIQUE,
  telefone      VARCHAR(20)     NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,   -- bcrypt cost=10
  is_admin      TINYINT(1)      NOT NULL DEFAULT 0,
  ativo         TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Usuário padrão:** `admin` / `admin` (is_admin = 1)

---

### Tabela: `catalogo`

```sql
CREATE TABLE catalogo (
  id         INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  marca      VARCHAR(100)    NOT NULL,
  sabor      VARCHAR(150)    NOT NULL,
  tamanho    VARCHAR(30)     NOT NULL,
  valor      DECIMAL(10,2)   NOT NULL,
  estoque    INT UNSIGNED    NOT NULL DEFAULT 0,
  emoji      VARCHAR(30)     NULL,
  categoria  ENUM('pods','bateria','liquido','acessorio') NOT NULL DEFAULT 'pods',
  ativo      TINYINT(1)      NOT NULL DEFAULT 1,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Marcas cadastradas:** IGNITE, ELF, ELFBAR, BLACK SHEEP, OXBAR, LOST MARY, LOST MIXER  
**Total de produtos:** 96 sabores

---

### Tabela: `enderecos`

```sql
CREATE TABLE enderecos (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED  NOT NULL,   -- FK → usuarios.id
  apelido     VARCHAR(50)   NULL,       -- "Casa", "Trabalho"...
  cep         CHAR(9)       NOT NULL,
  logradouro  VARCHAR(200)  NOT NULL,
  numero      VARCHAR(20)   NOT NULL,
  complemento VARCHAR(100)  NULL,
  bairro      VARCHAR(100)  NOT NULL,
  cidade      VARCHAR(100)  NOT NULL,
  estado      CHAR(2)       NOT NULL,
  principal   TINYINT(1)    NOT NULL DEFAULT 0,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
```

---

## Autenticação e Sessão

### Fluxo de Login

```
[/login] → POST /api/auth/login
         → validateCredentials() (bcrypt.compare)
         → Cookie httpOnly "podbay_session" = user.id
         → Redirect para página anterior ou /
```

### Fluxo de Cadastro

```
[/register] → POST /api/auth/register
            → Valida unicidade de email e telefone
            → Gera username a partir do email
            → bcrypt.hash(password, 10)
            → INSERT usuarios
            → Cookie httpOnly "podbay_session" = user.id  (já loga)
            → Redirect para /
```

### Fluxo de Logout

```
POST /api/auth/logout → cookie maxAge=0 → redirect /login
```

### Middleware de Proteção

Arquivo: `middleware.ts` (Edge Runtime)

- Rotas públicas: `/login`, `/register`, `/api/auth/*`
- Todas as outras rotas verificam a existência do cookie `podbay_session`
- Se ausente → redirect para `/login?from=[rota original]`

### Configurações do Cookie

| Propriedade | Valor |
|-------------|-------|
| Nome | `podbay_session` |
| Valor | ID do usuário (string) |
| httpOnly | `true` |
| secure | `true` em produção |
| sameSite | `lax` |
| maxAge | 604800 (7 dias) |

---

## Rotas e Páginas

| Rota | Tipo | Auth | Descrição |
|------|------|------|-----------|
| `/` | Server Component | ✅ | Home com catálogo de produtos |
| `/login` | Client Component | ❌ | Formulário de login |
| `/register` | Client Component | ❌ | Formulário de cadastro |
| `/profile` | Server Component | ✅ | Perfil do usuário + endereços |
| `/cart` | Client Component | ✅ | Carrinho de compras |

---

## APIs REST

### POST `/api/auth/login`

**Body:**
```json
{ "username": "string", "password": "string" }
```
> `username` aceita tanto o nome de usuário quanto o e-mail.

**Respostas:**
- `200` — `{ ok: true, user: { id, username, role } }` + cookie de sessão
- `400` — `{ error: "Credenciais inválidas" }`
- `401` — `{ error: "Usuário ou senha incorretos" }`

---

### POST `/api/auth/register`

**Body:**
```json
{
  "nome_completo": "string",
  "email": "string",
  "telefone": "string",
  "password": "string (mín. 6 chars)"
}
```

**Respostas:**
- `201` — `{ ok: true, user: { id, username, role } }` + cookie de sessão
- `400` — Campo faltando ou senha curta
- `409` — E-mail ou telefone já cadastrado

---

### POST `/api/auth/logout`

**Respostas:**
- `200` — `{ ok: true }` + cookie removido

---

### GET `/api/user/me` 🔒

**Respostas:**
- `200` — `{ user: { id, username, nome_completo, email, telefone, is_admin, created_at } }`
- `401` — Não autenticado
- `404` — Usuário não encontrado

---

### GET `/api/user/enderecos` 🔒

**Respostas:**
- `200` — `{ enderecos: [...] }` ordenados por `principal DESC, id ASC`
- `401` — Não autenticado

---

### POST `/api/user/enderecos` 🔒

**Body:**
```json
{
  "apelido": "string (opcional)",
  "cep": "string",
  "logradouro": "string",
  "numero": "string",
  "complemento": "string (opcional)",
  "bairro": "string",
  "cidade": "string",
  "estado": "string (UF)"
}
```

**Comportamento:** Primeiro endereço do usuário é automaticamente marcado como principal.

**Respostas:**
- `201` — `{ ok: true, id: number }`
- `400` — Campos obrigatórios faltando
- `401` — Não autenticado

---

### PATCH `/api/user/enderecos/:id` 🔒

Define o endereço como principal, removendo o flag dos outros.

**Respostas:**
- `200` — `{ ok: true }`
- `400` — ID inválido
- `401` — Não autenticado
- `404` — Endereço não encontrado ou não pertence ao usuário

---

## Componentes

### `HomeClient.tsx`

Renderiza a tela principal do catálogo.

**Funcionalidades:**
- Filtro por marca (pills dinâmicas geradas a partir do banco)
- Busca textual por marca, sabor ou tamanho
- Produtos agrupados por `marca + tamanho` em grid 2 colunas
- Logo da marca exibida no card (se disponível em `/public/brands/`)
- Modal bottom-sheet ao clicar num grupo, listando todos os sabores
- Adicionar ao carrinho diretamente pelo modal

**Logos disponíveis:**
```ts
const BRAND_LOGOS = {
  'BLACK SHEEP': '/brands/blacksheep.png',
  'ELFBAR':      '/brands/elfbar.png',
  'ELF':         '/brands/elf.png',
  'IGNITE':      '/brands/ignite.png',
  'LOST MARY':   '/brands/lostmary.png',
  'LOST MIXER':  '/brands/lostmary.png',
  'OXBAR':       '/brands/oxbar.png',
};
```

---

### `ProfileClient.tsx`

Renderiza o perfil do usuário.

**Funcionalidades:**
- Avatar com iniciais do nome
- Badge "Admin" para usuários com `is_admin = 1`
- Exibe username, e-mail e telefone
- Lista de endereços — clicar num endereço alternativo define como principal
- Modal de criação de novo endereço com auto-preenchimento via **ViaCEP API**

---

### `CartItem.tsx`

Exibe um item do carrinho com controles de quantidade (+ / −). Ao chegar em 0, o item é removido automaticamente.

---

### `BottomNav.tsx`

Barra de navegação fixa no rodapé com 3 abas: Início, Carrinho, Perfil.  
Badge numérico no ícone do Carrinho indica quantidade de itens.

---

## Contextos (State Management)

### `CartContext`

Gerencia o estado do carrinho. Persiste em `localStorage` sob a chave `podbay_cart`.

| Valor | Tipo | Descrição |
|-------|------|-----------|
| `items` | `CartItem[]` | Lista de itens no carrinho |
| `addToCart(produto)` | função | Adiciona produto ou incrementa quantidade |
| `changeQty(id, delta)` | função | Altera quantidade (+1 ou -1) |
| `finishOrder()` | função | Limpa o carrinho |
| `totalQty` | `number` | Total de unidades |
| `totalPrice` | `number` | Valor total em R$ |

---

### `AuthContext`

Expõe o usuário autenticado e a função de logout.

| Valor | Tipo | Descrição |
|-------|------|-----------|
| `user` | `AuthUser \| null` | Usuário da sessão atual |
| `logout()` | função | POST /api/auth/logout + redirect |

---

### `ToastContext`

Notificações temporárias de 2 segundos na parte inferior da tela.

| Valor | Tipo | Descrição |
|-------|------|-----------|
| `showToast(msg)` | função | Exibe mensagem flutuante |

---

## Variáveis de Ambiente

Arquivo: `.env.local` (não versionado)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=podbay_db
```

---

## Scripts SQL

### Criar tabelas
```bash
# No MySQL:
source c:/podbay/scripts/podbay_db.sql
```

### Popular catálogo
No MySQL com UTF-8 habilitado:
```bash
chcp 65001          # No CMD do Windows antes de conectar
mysql -u root -p podbay_db
```
Depois cole o conteúdo de `scripts/seed_catalogo.sql`.

### Adicionar colunas (se tabela já existia)
```sql
ALTER TABLE usuarios
  ADD COLUMN nome_completo VARCHAR(200) NOT NULL DEFAULT '' AFTER username,
  ADD COLUMN telefone VARCHAR(20) NULL AFTER email,
  ADD UNIQUE KEY uq_telefone (telefone);

ALTER TABLE catalogo MODIFY COLUMN emoji VARCHAR(30) NULL;
```

---

## Como Executar

### Desenvolvimento
```bash
cd c:\podbay
npm install
npm run dev
```
Acesse: `http://localhost:3000`

### Produção (Vercel)
1. Faça push para o repositório GitHub
2. Importe o projeto no [vercel.com](https://vercel.com)
3. Configure as variáveis de ambiente no painel da Vercel
4. Deploy automático a cada push

### Credenciais padrão
| Campo | Valor |
|-------|-------|
| Usuário | `admin` |
| Senha | `admin` |

---

*PODBAY © 2025 — Documentação gerada em 02/04/2026*
