// ============================================================================
// Tipos da base de conhecimento configurável da Fast EPS.
//
// Cada seção corresponde a uma linha na tabela `knowledge_config` (uma chave
// por seção). O objetivo é permitir que a empresa altere essas informações
// pelo painel administrativo sem precisar mexer em código.
// ============================================================================

export interface FaqItem {
  question: string;
  answer: string;
}

export interface CompanyInfo {
  name: string;
  segment: string;
  description: string;
  brandTraits: string[];
  toneOfVoice: string;
  /** Regra explícita: nunca inventar tempo de mercado enquanto não confirmado. */
  yearsInBusiness: string | null;
  disclaimerNoInvent: string;
}

export type ProductKey = "MOLDURA_EPS" | "PAINEL_MONOLITICO";

export interface ProductConfig {
  key: ProductKey;
  displayName: string;
  category: "acabamento_decoracao" | "solucao_construtiva";
  shortDescription: string;
  useCases: string[];
  benefits: string[];
  neverSay: string[];
  faq: FaqItem[];
}

export interface PricingConfig {
  policy: string;
  /** Tabela de preços por produto. `null`/vazio = não cadastrado -> IA nunca inventa valor. */
  priceTables: Record<ProductKey, Array<{ description: string; unit: string; price: number }> | null>;
}

export interface DeliveryConfig {
  policy: string;
  citiesServed: string[]; // vazio = não confirmado para nenhuma cidade específica
  freightTable: Array<{ city: string; note: string }> | null;
}

export interface InstallationConfig {
  policy: string;
  /** null = não confirmado no sistema; true/false = confirmado pela empresa. */
  offersInstallation: boolean | null;
  regionsAvailable: string[];
}

export interface TechnicalInfoConfig {
  thermalInsulation: string;
  acousticInsulation: string;
  structuralNotes: string;
  paintingCompatibility: string;
  outdoorUse: string;
}

export interface ContactInfoConfig {
  salesTeamNote: string;
  supportPhone: string | null;
  supportEmail: string | null;
  website: string | null;
  instagram: string | null;
}

export interface BusinessHoursConfig {
  timezone: string;
  startHour: number; // 0-23
  endHour: number; // 0-23
  daysOfWeek: number[]; // 0 = domingo ... 6 = sábado
  outOfHoursNotice: string;
}

export interface FollowUpSettingsConfig {
  enabled: boolean;
  delayHoursAfterNoResponse: number;
  maxAttempts: number;
  minHoursBetweenAttempts: number;
  applicableStatuses: string[];
  messageTemplateName: string;
  fallbackMessage: string;
}

export interface HumanHandoffSettingsConfig {
  handoffMessage: string;
  outOfHoursHandoffMessage: string;
  triggersDescription: string[];
}

export interface GreetingSettingsConfig {
  firstMessage: string;
  menuMessage: string;
  fallbackErrorMessage: string;
}

export interface KnowledgeBase {
  COMPANY_INFO: CompanyInfo;
  PRODUCTS: ProductConfig[];
  PRICING: PricingConfig;
  DELIVERY: DeliveryConfig;
  INSTALLATION: InstallationConfig;
  TECHNICAL_INFORMATION: TechnicalInfoConfig;
  CONTACT_INFORMATION: ContactInfoConfig;
  BUSINESS_HOURS: BusinessHoursConfig;
  FOLLOW_UP_SETTINGS: FollowUpSettingsConfig;
  HUMAN_HANDOFF_SETTINGS: HumanHandoffSettingsConfig;
  GREETING_SETTINGS: GreetingSettingsConfig;
}

export type KnowledgeKey = keyof KnowledgeBase;
