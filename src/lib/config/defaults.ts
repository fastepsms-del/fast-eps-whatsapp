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
      "Grosso do Sul, com base em Campo Grande. Atuamos desde 2018 com painel monolítico e molduras em EPS, e " +
      "damos 5 ANOS DE GARANTIA. Também fazemos FORRO em EPS. Sede, fábrica e local de atendimento: Rua " +
      "Vanderlei Pavão, 275, Jardim Aeroporto, Campo Grande/MS — só informe o endereço se o cliente perguntar " +
      "onde fica ou de onde somos; nunca por iniciativa própria. Não existe pedido mínimo. Quem mais compra: " +
      "instaladores que nos recomendam, arquitetos e pessoas físicas construindo a própria casa; muitos nunca " +
      "usaram EPS e chegam desconfiados, perguntando se é resistente, durável e se aguenta chuva e sol.",
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
    yearsInBusiness:
      "Atuamos desde 2018 nesse ramo (painel monolítico, molduras em EPS). Pode dizer que temos bastante " +
      "tempo de experiência e que começamos em 2018, sem exagerar nem inventar números de obras ou clientes.",
    disclaimerNoInvent:
      "Nunca informar prêmios, certificações, normas, quantidade de obras/clientes ou outros números " +
      "institucionais que não estejam cadastrados aqui. Tempo de mercado (desde 2018) e garantia de 5 anos " +
      "estão cadastrados e podem ser usados.",
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
        "Mais baratas que os métodos tradicionais",
        "Conforto térmico e acústico",
        "Boa resistência: argamassa e tela de fibra de vidro protegem de chuva, sol, calor, frio e tempestade",
        "Pode ser feita sem revestimento (só o EPS) ou com revestimento",
        "5 anos de garantia",
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
          question: "Vocês vendem a moldura sem revestimento?",
          answer:
            "Sim. Fazemos a moldura com revestimento e também sem revestimento, só o EPS, se o cliente preferir.",
        },
        {
          question: "Como a moldura de EPS é feita e por que é resistente?",
          answer:
            "O EPS tem só a função de molde: ele dá o formato da moldura e não é estrutural. A resistência vem " +
            "do revestimento de argamassa com tela de fibra de vidro, que protege contra chuva, sol, calor, " +
            "frio e tempestade.",
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
        "Economia de 15% a 30% no custo da obra em relação aos métodos tradicionais",
        "Entrega mais rápida e instalação mais fácil que os outros métodos",
        "Gera bem menos entulho",
        "Conforto térmico e acústico",
        "Criado na Itália justamente para ser muito resistente: aguenta tempestades, dificuldades climáticas, sol, água, chuva e muito mais",
        "Existem testes públicos de resistência (balístico, fogo, água) que o cliente pode ver no YouTube",
        "5 anos de garantia",
      ],
      neverSay: [
        "é só isopor",
        "capacidade estrutural específica sem dados técnicos do projeto",
        "prazo de obra garantido sem avaliar o projeto",
        "nível específico de isolamento acústico sem dados técnicos",
      ],
      faq: [
        {
          question: "Precisa de mão de obra especializada?",
          answer:
            "Sim, muito provavelmente. Não é difícil de instalar, mas pede mão de obra especializada. Se a " +
            "equipe do cliente não souber, a Fast EPS dá treinamento técnico, ou faz a instalação.",
        },
        {
          question: "Qual o prazo?",
          answer:
            "A produção e entrega levam de 10 a 15 dias, e na prática fica mais perto de 10. A instalação, " +
            "em obra grande, costuma levar de 1 a 4 ou 5 dias, dependendo do tamanho e da quantidade das " +
            "peças; a equipe confirma depois de ver o projeto.",
        },
        {
          question: "Vale a pena? É mais barato?",
          answer:
            "A economia na obra costuma ficar entre 15% e 30% em relação aos métodos tradicionais, além de " +
            "ser mais rápido de entregar e instalar e gerar bem menos entulho.",
        },
        {
          question: "Como é o painel monolítico por dentro? É resistente mesmo?",
          answer:
            "O EPS funciona como molde e não tem função estrutural. Quem dá a resistência é o conjunto ao redor " +
            "dele (argamassa, travas e chapisco). O sistema foi criado na Itália justamente para ser resistente e " +
            "aguentar tempestades, sol, chuva, água e outras dificuldades climáticas, e existem testes de fogo, água e balísticos públicos no YouTube para o cliente ver.",
        },
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
    {
      key: "FORRO_EPS",
      displayName: "Forro em EPS",
      category: "acabamento_decoracao",
      shortDescription:
        "Forro em EPS. Fazemos o forro e também vendemos só as placas, se o cliente preferir.",
      useCases: ["Forro de ambientes internos e externos", "Venda apenas das placas"],
      benefits: ["Leveza", "Facilidade de instalação", "Conforto térmico e acústico", "5 anos de garantia"],
      neverSay: ["preço ou prazo de forro sem passar pela equipe", "especificação técnica não cadastrada"],
      faq: [
        {
          question: "Vocês fazem forro?",
          answer:
            "Fazemos sim, e também vendemos só as placas se o cliente quiser. Para orçar, precisamos das " +
            "medidas do forro/local; depois a equipe assume o orçamento.",
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
      "FORMAS DE PAGAMENTO (informe se perguntarem): 50% de entrada, obrigatória para começar a produção, e " +
      "os outros 50% na entrega. A entrada pode ser parcelada em até 2x sem juros; acima disso, até 10x com " +
      "os juros da máquina. Mesmo parcelando, a entrada mínima é de 50%. Nunca prometer desconto, nem outra " +
      "condição. Não existe pedido mínimo. " +
      "FORRO: nunca passar valor; peça as medidas e encaminhe para a equipe. " +
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
      "PRAZO de produção e entrega: de 10 a 15 dias, e na prática mais perto de 10 do que de 15 — ao informar, " +
      "diga isso para passar confiança (sem prometer data exata antes de a equipe confirmar o projeto). " +
      "Entregamos em todo o estado de Mato Grosso do Sul; o frete é à parte e combinado conforme a " +
      "localização da obra (nunca inventar valor de frete). Quando o cliente não tem as medidas, em " +
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
      "instalação ou só do material. A instalação é rápida: em obras grandes costuma levar de 1 a 4 ou 5 dias " +
      "no máximo. O tempo depende principalmente do TAMANHO e da QUANTIDADE das peças e do tamanho do " +
      "orçamento (peças maiores costumam ser mais rápidas de produzir e instalar), então nunca prometa um " +
      "prazo exato: diga que a equipe confirma depois de ver o projeto. O painel monolítico exige mão de obra " +
      "especializada, mas não é difícil de instalar; se o cliente ou a equipe dele não souber, a Fast EPS " +
      "treina (treinamento técnico). O que fica por fora do nosso fornecimento: fundação, hidráulica, elétrica " +
      "e, principalmente, a parte de acabamento.",
    offersInstallation: true,
    regionsAvailable: ["Mato Grosso do Sul (todo o estado)"],
  },

  TECHNICAL_INFORMATION: {
    thermalInsulation:
      "Painel monolítico e molduras em EPS trazem conforto térmico; o EPS é isolante. Sem prometer número " +
      "específico: o resultado final depende da composição completa da parede/sistema.",
    acousticInsulation:
      "Painel monolítico e molduras trazem conforto acústico. Não prometer número específico (dB) sem dados " +
      "técnicos; depende da composição completa da parede.",
    structuralNotes:
      "O EPS em si NÃO tem função estrutural — ele funciona como molde/forma. Quem dá a função estrutural " +
      "ao sistema é a composição ao redor dele: argamassa, travas/travamentos e chapisco, que juntos " +
      "garantem a estruturação completa. Capacidade estrutural específica depende do dimensionamento, " +
      "aplicação e execução corretos de cada projeto — não prometer números sem informações técnicas do " +
      "projeto. Nas MOLDURAS, o EPS é só o molde (dá o formato) e a resistência vem da argamassa com tela " +
      "de fibra de vidro, que protegem de chuva, sol, calor, frio e tempestade. O painel monolítico foi " +
      "criado na Itália (curiosidade histórica, só contar se o cliente tiver interesse em saber) justamente para ser muito resistente a tempestades, sol, chuva, água e dificuldades climáticas; há testes públicos (balístico, fogo, água) " +
      "no YouTube, que podem ser indicados ao cliente.",
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
    instagram: "@fast_eps (https://www.instagram.com/fast_eps/)",
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
      "Já temos as medidas/projeto, a resposta sobre instalação e o nome do cliente (qualificação completa)",
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
