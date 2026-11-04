window.GF_CONTRATACAO_CONFIG = Object.freeze({
  mode: "mock",
  previewLabel: "Prévia interna. Nenhum pedido ou pagamento real será criado.",
  campaign: {
    slug: "entre-estacoes",
    name: "Entre Estações",
    schoolName: "ENTREPLIÉS",
    eventDate: "2026-11-07",
    venue: "",
    miniStart: "",
    miniEnd: "",
    miniDurationMinutes: 5,
    miniCapacity: null,
    reservationMinutes: 15,
    reconciliationGraceMinutes: 15,
    salesClosesAt: "",
    deliveryDeadline: "",
    published: false,
    contactWhatsapp: "5534992632922",
    heroImage: ""
  },
  packages: [
    {
      id: "miniensaio",
      code: "miniensaio",
      title: "Miniensaio no teatro",
      priceCents: 11900,
      description: "Um registro delicado da bailarina com o figurino do espetáculo e sua família.",
      includesMini: true,
      includesStage: false,
      items: [
        "3 fotografias individuais com o figurino",
        "2 fotografias com familiares",
        "5 fotografias digitais tratadas",
        "Atendimento aproximado de 5 minutos"
      ]
    },
    {
      id: "palco",
      code: "palco",
      title: "Fotos de palco",
      priceCents: 7900,
      description: "Os movimentos, a expressão e a presença da bailarina durante as apresentações.",
      includesMini: false,
      includesStage: true,
      items: [
        "No mínimo 10 fotografias digitais de cada coreografia",
        "Registros durante as apresentações",
        "Entrega digital em galeria exclusiva"
      ]
    },
    {
      id: "completo",
      code: "completo",
      title: "Pacote completo",
      priceCents: 15900,
      description: "Uma recordação completa, reunindo os momentos no teatro e no palco.",
      includesMini: true,
      includesStage: true,
      items: [
        "3 fotografias individuais com o figurino",
        "2 fotografias com familiares",
        "No mínimo 10 fotografias de cada coreografia",
        "Atendimento aproximado de 5 minutos",
        "Entrega digital em galeria exclusiva"
      ],
      featured: true
    }
  ],
  supplier: {
    legalName: "",
    document: "",
    businessAddress: "",
    businessEmail: ""
  },
  terms: {
    version: "rascunho-1",
    title: "Condições da contratação fotográfica",
    body: "Este documento está em preparação e não constitui a versão final para contratação. Os dados cadastrais oficiais do fornecedor e as condições finais de entrega, atendimento, cancelamento e reembolso deverão ser preenchidos e revisados antes da publicação."
  }
});