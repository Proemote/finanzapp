export const INCOME_CATEGORIES = [
  "Ventas e ingresos",
  "Devoluciones y reembolsos",
  "Otros ingresos",
] as const;

export const EXPENSE_CATEGORIES = [
  "Alquiler y local",
  "Suministros",
  "Nóminas y personal",
  "Impuestos y tasas",
  "Cuota de autónomos / Seg. Social",
  "Software y suscripciones",
  "Marketing y publicidad",
  "Transporte y combustible",
  "Restauración y dietas",
  "Compras y material",
  "Seguros",
  "Comisiones bancarias",
  "Préstamos y financiación",
  "Salud",
  "Ocio y personal",
  "Otros gastos",
] as const;

export const ALL_CATEGORIES: string[] = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const UNCLASSIFIED = "Sin clasificar";

/**
 * Reglas por palabra clave para clasificar sin IA (fallback y primera pasada).
 * Se evalúan en orden sobre la descripción normalizada (minúsculas, sin tildes).
 */
const EXPENSE_RULES: [string, string[]][] = [
  ["Cuota de autónomos / Seg. Social", ["seguridad social", "tgss", "cuota autonomo", "regimen especial"]],
  ["Impuestos y tasas", ["aeat", "agencia tributaria", "hacienda", "modelo 130", "modelo 303", "irpf", "iva ", "ayuntamiento", "tasa"]],
  ["Nóminas y personal", ["nomina", "salario", "payroll"]],
  ["Alquiler y local", ["alquiler", "arrendamiento", "renta local", "rent "]],
  ["Suministros", ["iberdrola", "endesa", "naturgy", "holaluz", "aguas de", "canal isabel", "movistar", "vodafone", "orange", "yoigo", "digi", "pepephone", "fibra", "electricidad", "gas natural"]],
  ["Software y suscripciones", ["google cloud", "google workspace", "gsuite", "aws", "amazon web services", "microsoft 365", "office 365", "adobe", "canva", "figma", "notion", "slack", "zoom", "dropbox", "github", "openai", "anthropic", "chatgpt", "netflix", "spotify", "hosting", "dominio", "godaddy", "ionos", "ovh", "supabase", "vercel", "shopify", "suscripcion"]],
  ["Marketing y publicidad", ["google ads", "googleads", "facebook ads", "facebk", "meta platforms", "tiktok ads", "linkedin", "mailchimp", "publicidad"]],
  ["Transporte y combustible", ["gasolinera", "repsol", "cepsa", "bp ", "shell", "galp", "uber", "cabify", "bolt", "taxi", "renfe", "metro", "emt", "parking", "aparcamiento", "autopista", "peaje", "itv", "vueling", "ryanair", "iberia"]],
  ["Restauración y dietas", ["restaurante", "cafeteria", "cafe ", "bar ", "burger", "mcdonald", "kfc", "telepizza", "glovo", "just eat", "justeat", "uber eats", "deliveroo", "panaderia"]],
  ["Compras y material", ["amazon", "aliexpress", "leroy merlin", "ikea", "media markt", "mediamarkt", "el corte ingles", "carrefour", "mercadona", "lidl", "dia ", "alcampo", "ferreteria", "papeleria", "material oficina"]],
  ["Seguros", ["mapfre", "axa", "allianz", "mutua", "linea directa", "generali", "sanitas seguro", "seguro"]],
  ["Comisiones bancarias", ["comision", "mantenimiento cuenta", "comisiones", "cuota tarjeta"]],
  ["Préstamos y financiación", ["prestamo", "hipoteca", "amortizacion", "cuota prestamo", "financiacion", "leasing", "renting"]],
  ["Salud", ["farmacia", "clinica", "dentista", "fisio", "medico", "sanitas", "adeslas", "quiron"]],
  ["Ocio y personal", ["cine", "teatro", "gimnasio", "gym", "decathlon", "zara", "primark", "h&m", "viaje", "booking", "airbnb", "hotel"]],
];

const INCOME_RULES: [string, string[]][] = [
  ["Ventas e ingresos", ["factura", "stripe", "paypal", "bizum recibido", "abono transferencia", "transferencia recibida", "ingreso ventas", "tpv", "redsys", "shopify"]],
  ["Devoluciones y reembolsos", ["devolucion", "reembolso", "refund"]],
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Clasificación por reglas. Devuelve UNCLASSIFIED si ninguna regla aplica. */
export function classifyByRules(description: string, amount: number): string {
  const desc = normalize(description);
  const rules = amount >= 0 ? INCOME_RULES : EXPENSE_RULES;
  for (const [category, keywords] of rules) {
    if (keywords.some((kw) => desc.includes(kw))) return category;
  }
  return UNCLASSIFIED;
}

/** Categoría genérica según el signo, para cerrar huecos tras la IA. */
export function defaultCategory(amount: number): string {
  return amount >= 0 ? "Otros ingresos" : "Otros gastos";
}
