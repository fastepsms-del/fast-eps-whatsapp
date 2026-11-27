/**
 * Mensagens automáticas que NÃO são uma pessoa falando: saudação/ausência do WhatsApp Business e o texto
 * que a Meta pré-preenche quando o cliente clica no anúncio. Tratadas como "ruído" para decidir se alguém
 * da equipe já conversou com o contato.
 */
const AUTOMATED_PATTERNS: RegExp[] = [
  /agradece\s+(o\s+)?seu\s+contato/i,
  /obrigad[oa]\s+(pelo|por\s+entrar\s+em)\s+contato/i,
  /em\s+breve\s+(um|uma)\s+(especialista|atendente|consultor|consultora|representante)/i,
  /em\s+breve\s+(entraremos|retornaremos|responderemos)/i,
  /(entrar[aá]|falar[aá])\s+em\s+contato\s+com\s+voc[eê]/i,
  /^\s*(oi|ol[aá])[,!.]?\s*como\s+(podemos|posso)\s+(te\s+)?ajudar\??\s*$/i,
  /(estamos|estou)\s+(ausente|ausentes|fora\s+do\s+hor[aá]rio|indispon[ií]ve(l|is))/i,
  /no\s+momento\s+n[aã]o\s+(estamos|estou)\s+(dispon[ií]ve(l|is)|atendendo)/i,
  /mensagem\s+autom[aá]tica/i,
];

export function isAutomatedMessage(text: string | null | undefined): boolean {
  const value = (text ?? "").trim();
  if (!value) return false;
  return AUTOMATED_PATTERNS.some((pattern) => pattern.test(value));
}
