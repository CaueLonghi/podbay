// DDDs válidos do território brasileiro
const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
  21, 22, 24,                           // RJ
  27, 28,                               // ES
  31, 32, 33, 34, 35, 37, 38,          // MG
  41, 42, 43, 44, 45, 46,              // PR
  47, 48, 49,                           // SC
  51, 53, 54, 55,                       // RS
  61,                                   // DF / GO
  62, 64,                               // GO
  63,                                   // TO
  65, 66,                               // MT
  67,                                   // MS
  68,                                   // AC
  69,                                   // RO
  71, 73, 74, 75, 77,                  // BA
  79,                                   // SE
  81, 87,                               // PE
  82,                                   // AL
  83,                                   // PB
  84,                                   // RN
  85, 88,                               // CE
  86, 89,                               // PI
  91, 93, 94,                           // PA
  92, 97,                               // AM
  95,                                   // RR
  96,                                   // AP
  98, 99,                               // MA
]);

export function validarNome(nome: string): string | null {
  const t = nome.trim();
  if (!t) return 'Nome é obrigatório';
  const partes = t.split(/\s+/).filter(Boolean);
  if (partes.length < 2) return 'Informe nome e sobrenome';
  if (partes.some((p) => p.length < 2)) return 'Nome e sobrenome devem ter pelo menos 2 letras cada';
  return null;
}

export function validarEmail(email: string): string | null {
  const t = email.trim();
  if (!t) return 'E-mail é obrigatório';
  // nome@provedor.tld — pelo menos um ponto no domínio
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'E-mail inválido';
  return null;
}

export function validarTelefone(telefone: string): string | null {
  const digits = telefone.replace(/\D/g, '');
  if (!digits) return 'Telefone é obrigatório';
  if (digits.length < 10 || digits.length > 11) return 'Telefone inválido — use DDD + número';
  const ddd = Number(digits.slice(0, 2));
  if (!DDDS_VALIDOS.has(ddd)) return `DDD ${ddd} inválido`;
  // celular: 11 dígitos começando com 9; fixo: 10 dígitos
  if (digits.length === 11 && digits[2] !== '9') return 'Celular deve começar com 9 após o DDD';
  return null;
}

export function validarCPF(cpf: string): string | null {
  const digits = cpf.replace(/\D/g, '');
  if (!digits) return 'CPF é obrigatório';
  if (digits.length !== 11) return 'CPF deve ter 11 dígitos';
  // Rejeita sequências iguais (111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(digits)) return 'CPF inválido';

  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(digits[i]) * (10 - i);
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (d1 !== Number(digits[9])) return 'CPF inválido';

  // Segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(digits[i]) * (11 - i);
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  if (d2 !== Number(digits[10])) return 'CPF inválido';

  return null;
}

export function mascaraCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function mascaraTelefone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
