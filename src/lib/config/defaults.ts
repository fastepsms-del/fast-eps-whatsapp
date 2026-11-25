import type { KnowledgeBase } from "./types";

// ============================================================================
// Base de conhecimento padrão da Fast EPS.
//
// Estes valores são usados para popular o banco (prisma/seed.ts) e como
// fallback em memória caso uma seção ainda não exista no banco. Tudo aqui
// reflete o briefing oficial repassado pela empresa. Informações não
// confirmadas (preços, tempo de mercado, instalação, frete, cidades
// atendidas) ficam deliberadamente em branco/null — a IA tem instrução
// explícita de nunca inventar esses dados.
// ============================================================================

export const DEFAULT_KNOWLEDGE_BASE: KnowledgeBase = {
  COMPANY_INFO: {
    name: "Fast EPS",
    segment: "Construção e acabamento em EPS (isopor de engenharia)",
    description:
      "A Fast EPS trabalha com soluções em EPS para acabamento e decoração arquitetônica (molduras) " +
      "e para soluções construtivas (painéis monolíticos). Atende tanto quem busca acabamento estético " +
      "para fachadas quanto quem busca soluções construtivas com painéis. Atende todo o estado de Mato " +
      "Grosso do Sul, com base em Campo Grande.",
    brandTraits: [
      "profissionalismo",
      "conhecimento técnico",
      "agilidade",
      "confiança",
      "qualidade",
      "praticidade",
      "modernidade",
      "atendimento personalizado",
    ],
    toneOfVoice:
      "Humanizado e próximo, como um vendedor conversando no WhatsApp: simpático, educado e direto, com " +
      "mensagens curtas e naturais — nunca robótico, sem textão e sem gírias pesadas.",
    yearsInBusiness: null,
    disclaimerNoInvent:
      "Nunca informar tempo de mercado, prêmios ou números institucionais que não estejam cadastrados aqui.",
  },

  PRODUCTS: [
    {
      key: "MOLDURA_EPS",
      displayName: "Molduras em EPS",
      category: "acabamento_decoracao",
      shortDescription:
        "Molduras em EPS para acabamento e decoração arquitetônica: fachadas, beirais, contornos de " +
        "portas e janelas, sancas, frisos e detalhes arquitetônicos. São feitas SOB MEDIDA, e o cálculo é " +
        "por METRO LINEAR.",
      useCases: [
        "Fachadas",
        "Beirais",
        "Contornos de portas",
        "Contornos de janelas",
        "Sancas",
        "Frisos",
        "Detalhes arquitetônicos",
        "Acabamentos externos",
        "Acabamentos internos",
        "Elementos decorativos",
        "Projetos personalizados",
      ],
      benefits: [
        "Leveza",
        "Facilidade de instalação",
        "Versatilidade de formatos",
        "Possibilidade de personalização",
        "Bom acabamento",
        "Facilidade para criar detalhes arquitetônicos",
        "Redução de peso em comparação com elementos construtivos mais pesados",
        "Diferentes desenhos e modelos",
        "Visual sofisticado sem necessariamente utilizar peças pesadas",
      ],
      neverSay: [
        "nunca quebra",
        "dura para sempre",
        "não precisa de manutenção",
        "é indestrutível",
        "qualquer formato é garantido sem avaliação de viabilidade",
      ],
      faq: [
        {
          question: "Moldura de EPS pode ser usada em área externa?",
          answer:
            "Existem aplicações externas de molduras em EPS, mas o desempenho depende do sistema de " +
            "acabamento e da instalação adequados para a exposição ao ambiente.",
        },
        {
          question: "Pode pintar?",
          answer:
            "Sim, dependendo do sistema de acabamento utilizado. A pintura deve ser feita com produtos " +
            "compatíveis com o acabamento aplicado.",
        },
        {
          question: "Pode fazer qualquer modelo?",
          answer:
            "Trabalhamos com diferentes modelos e podemos avaliar soluções personalizadas de acordo com " +
            "o projeto e a viabilidade de fabricação.",
        },
        {
          question: "É pesada?",
          answer:
            "As molduras em EPS são leves — uma das características que facilita transporte, manuseio e " +
            "instalação.",
        },
        {
          question: "É resistente?",
          answer:
            "O EPS é leve, e o desempenho da moldura depende também do acabamento, do sistema utilizado " +
            "e da instalação correta.",
        },
        {
          question: "Vocês fazem sob medida?",
          answer:
            "Sim, as molduras são feitas sob medida, de acordo com o projeto e a viabilidade de fabricação.",
        },
        {
          question: "Como é calculado o valor da moldura?",
          answer:
            "O cálculo é por metro linear, então depende das medidas do muro/local e do modelo. Por isso " +
            "precisamos das medidas para passar o orçamento.",
        },
        {
          question: "Vocês instalam?",
          answer:
            "Isso depende da configuração cadastrada em INSTALLATION. Se não houver confirmação, informar " +
            "que a equipe será consultada sobre disponibilidade de instalação para a região.",
        },
      ],
    },
    {
      key: "PAINEL_MONOLITICO",
      displayName: "Painel monolítico em EPS",
      category: "solucao_construtiva",
      shortDescription:
        "Sistema construtivo que utiliza EPS dentro de uma composição estrutural/revestida, usado na " +
        "execução de paredes e elementos da construção — não é apenas isopor solto. É vendido por METRO " +
        "QUADRADO de parede, já com as travas.",
      useCases: [
        "Execução de paredes",
        "Elementos construtivos",
        "Obras residenciais",
        "Obras comerciais",
        "Projetos que buscam agilidade na execução",
      ],
      benefits: [
        "Rapidez na execução",
        "Leveza",
        "Praticidade",
        "Redução do peso da construção",
        "Facilidade de transporte e manuseio",
        "Otimização da execução da obra",
        "Solução construtiva moderna",
      ],
      neverSay: [
        "é só isopor",
        "capacidade estrutural específica sem dados técnicos do projeto",
        "prazo de obra garantido sem avaliar o projeto",
        "nível específico de isolamento acústico sem dados técnicos",
      ],
      faq: [
        {
          question: "Como é calculado o valor do painel monolítico?",
          answer:
            "O cálculo é por metro quadrado de parede, e a análise parte do projeto. Dá pra fornecer só o " +
            "painel, com instalação pela nossa equipe ou com treinamento da equipe da obra.",
        },
        {
          question: "O que é painel monolítico?",
          answer:
            "É um sistema construtivo que utiliza EPS integrado a uma composição de elementos que, após a " +
            "execução correta, forma o sistema de parede/elemento construtivo.",
        },
        {
          question: "É só isopor?",
          answer:
            "Não. O EPS é apenas um dos componentes do sistema. O painel monolítico faz parte de uma " +
            "composição construtiva que recebe os elementos necessários para formar o sistema final.",
        },
        {
          question: "É resistente?",
          answer:
            "O sistema foi desenvolvido para aplicação construtiva, e seu desempenho depende da " +
            "composição, do dimensionamento e da execução correta. Para a aplicação adequada na obra, " +
            "nossa equipe pode analisar o projeto.",
        },
        {
          question: "É mais rápido que uma construção convencional?",
          answer:
            "Pode proporcionar maior agilidade em determinadas etapas devido às características do " +
            "sistema, mas o prazo total depende do projeto, da equipe, do tamanho da obra e da execução.",
        },
        {
          question: "Posso construir uma casa?",
          answer:
            "O sistema pode ser utilizado em projetos construtivos, mas a aplicação deve ser avaliada " +
            "conforme o projeto e as especificações técnicas.",
        },
        {
          question: "Tem isolamento térmico?",
          answer:
            "O EPS possui propriedades de isolamento térmico, mas o desempenho final da construção " +
            "depende de toda a composição da parede, espessuras, revestimentos, aberturas e condições da " +
            "obra.",
        },
        {
          question: "Tem isolamento acústico?",
          answer:
            "O desempenho acústico depende da composição completa da parede e dos demais elementos " +
            "construtivos — não há um nível específico a prometer sem dados técnicos.",
        },
      ],
    },
  ],

  PRICING: {
    policy:
      "EVITE falar de valores por iniciativa própria: primeiro entenda o projeto/medidas. Só informe preço " +
      "se o cliente perguntar diretamente. Se perguntar como é calculado: painel monolítico é por METRO " +
      "QUADRADO de parede (não de terreno/área construída — um galpão de 200m² tem bem menos parede que uma " +
      "kitnet de 200m²) e molduras em EPS são SOB MEDIDA e calculadas por METRO LINEAR. " +
      "PAINEL MONOLÍTICO (valores só do painel, já com as travas, SEM instalação, treinamento nem frete): " +
      "R$ 139,00/m² é o painel reforçado, feito para aguentar mais de um andar (sobrados); R$ 129,00/m² é o " +
      "painel com menos resistência, indicado para áreas térreas, sem sobrado. Ao informar, deixe claro que é " +
      "o valor do painel por m² e que o orçamento final depende do projeto, da modalidade (só entrega, " +
      "instalação ou treinamento) e do frete. " +
      "MOLDURAS: nunca passar valor — não há tabela; depende das medidas e do modelo, então peça as medidas " +
      "do muro/local. Nunca invente preço, desconto ou condição de pagamento.",
    priceTables: {
      MOLDURA_EPS: null,
      PAINEL_MONOLITICO: [
        {
          description: "Painel monolítico reforçado, com travas (suporta mais de um andar / sobrado). Só o painel.",
          unit: "m²",
          price: 139,
        },
        {
          description: "Painel monolítico padrão, com travas (menor resistência, indicado para áreas térreas). Só o painel.",
          unit: "m²",
          price: 129,
        },
      ],
    },
  },

  DELIVERY: {
    policy:
      "Entregamos em todo o estado de Mato Grosso do Sul; o frete é à parte e combinado conforme a " +
      "localização da obra (nunca inventar valor nem prazo de frete). Quando o cliente não tem as medidas, em " +
      "CAMPO GRANDE a equipe vai até o local tirar as medidas, SEM custo adicional, só para fazer o orçamento " +
      "— esse atendimento gratuito é só em Campo Grande, não no resto do estado.",
    citiesServed: ["Campo Grande"],
    freightTable: null,
  },

  INSTALLATION: {
    policy:
      "A Fast EPS faz instalação em todo o Mato Grosso do Sul e trabalha com três modalidades, para painel " +
      "monolítico e para molduras, cada uma com seu valor: (1) SÓ ENTREGA do material (só painel ou só " +
      "moldura, sem instalação); (2) entrega + equipe técnica da Fast EPS faz a instalação; (3) entrega + " +
      "equipe técnica da Fast EPS vai até o canteiro de obras TREINAR as equipes locais e entregar o produto " +
      "(no painel monolítico, a equipe viaja até o local no estado para o treinamento). A escolha é sempre " +
      "do cliente, instalar com a Fast EPS nunca é obrigatório. Pergunte, no momento certo, se ele precisa de " +
      "instalação ou só do material.",
    offersInstallation: true,
    regionsAvailable: ["Mato Grosso do Sul (todo o estado)"],
  },

  TECHNICAL_INFORMATION: {
    thermalInsulation:
      "O EPS possui propriedades de isolamento térmico; o desempenho final depende da composição completa " +
      "da parede/sistema.",
    acousticInsulation:
      "O desempenho acústico depende da composição completa da parede e dos demais elementos construtivos; " +
      "não prometer número específico sem dados técnicos.",
    structuralNotes:
      "O EPS em si NÃO tem função estrutural — ele funciona como molde/forma. Quem dá a função estrutural " +
      "ao sistema é a composição ao redor dele: argamassa, travas/travamentos e chapisco, que juntos " +
      "garantem a estruturação completa. Capacidade estrutural específica depende do dimensionamento, " +
      "aplicação e execução corretos de cada projeto — não prometer números sem informações técnicas do " +
      "projeto.",
    paintingCompatibility:
      "Pode ser pintado dependendo do sistema de acabamento utilizado, com produtos compatíveis.",
    outdoorUse:
      "Existem aplicações externas, mas o desempenho depende do sistema de acabamento e da instalação " +
      "adequados à exposição do ambiente.",
  },

  CONTACT_INFORMATION: {
    salesTeamNote: "Equipe comercial Fast EPS (dados de contato a cadastrar).",
    supportPhone: null,
    supportEmail: null,
    website: null,
    instagram: null,
  },

  BUSINESS_HOURS: {
    timezone: "America/Sao_Paulo",
    startHour: 7,
    endHour: 18,
    daysOfWeek: [1, 2, 3, 4, 5, 6], // segunda a sábado
    outOfHoursNotice:
      "Nossa equipe humana atende das 7h às 18h. Fora desse horário eu continuo te ajudando por aqui, e " +
      "assim que possível um consultor dá continuidade.",
  },

  FOLLOW_UP_SETTINGS: {
    enabled: true,
    delayHoursAfterNoResponse: 24,
    maxAttempts: 2,
    minHoursBetweenAttempts: 48,
    applicableStatuses: [
      "ORCAMENTO_SOLICITADO",
      "AGUARDANDO_INFORMACOES",
      "INTERESSADO",
      "NEGOCIACAO",
    ],
    messageTemplateName: "fast_eps_followup_generico",
    fallbackMessage:
      "Olá! Passando para saber se você conseguiu verificar as informações do seu projeto em EPS. Se " +
      "quiser, pode me mandar as medidas, uma foto ou o que precisar por aqui que eu dou continuidade. 🙂",
  },

  HUMAN_HANDOFF_SETTINGS: {
    handoffMessage: "Claro! Vou encaminhar seu atendimento para nossa equipe para que possamos te atender da melhor forma.",
    outOfHoursHandoffMessage:
      "Claro! Vou encaminhar seu atendimento para nossa equipe. Nosso horário de atendimento humano é das " +
      "7h às 18h — assim que reabrirmos, um consultor dá continuidade ao seu atendimento.",
    triggersDescription: [
      "Cliente pede para falar com uma pessoa",
      "Negociação de preço/condição comercial especial",
      "Reclamação",
      "Dúvida técnica complexa",
      "Necessidade de analisar um projeto",
      "Pergunta fora da base de conhecimento cadastrada",
      "Dúvida sobre instalação não confirmada",
      "Orçamento personalizado",
      "Intenção clara de compra que depende de intervenção humana",
    ],
  },

  GREETING_SETTINGS: {
    firstMessage:
      "Oi, tudo bem? Aqui é da Fast EPS 👋 Trabalhamos com molduras em EPS e painel monolítico. Você " +
      "está buscando qual dos dois?",
    menuMessage:
      "Olá! Seja bem-vindo à Fast EPS 👋 Trabalhamos com soluções em EPS para construção e acabamento. " +
      "Você gostaria de saber mais sobre:\n1️⃣ Molduras em EPS\n2️⃣ Painel monolítico\n3️⃣ Solicitar orçamento\n" +
      "4️⃣ Tirar uma dúvida\n5️⃣ Falar com um atendente",
    fallbackErrorMessage: "Entendi! Vou te encaminhar para nossa equipe de atendimento, só um instante.",
  },
};
