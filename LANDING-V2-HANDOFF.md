# Grand Focus — Form First V2
Validação em branch de aquisição, sem merge ou publicação no domínio público.
- 4 ofertas compactas; A/B mantém formulário, layout, imagem reservada, CTA e região iguais. Origem imutável por rota em V2; backend aceita V1.
- Fotos reais e número comercial oficial pendentes; não foram usados arquivos privados. Botão de WhatsApp após cadastro só aparece quando número oficial configurado e produção aprovada. Testes usam dados fictícios.
- CRM: indicadores do funil/ambiente, lista/cartões, filtros, exportação até 10 mil registros por filtro, status, notas, contato realizado, follow-up e histórico. Polling de métricas a cada 30 segundos em aba visível; alerta visual, áudio mediante clique. A lista não é reconstruída durante a edição; botão Ver novos. Sem notificações externas nesta versão.
- SQL V2 altera somente gf_marketing_leads: history/proposed_at, trigger e RPC agregadora SECURITY INVOKER. RLS existente preservada. Sem dados reais habilitados.
- Validação: sintaxe JS, validação servidor simulada, transação SQL revertida com insert B2B/B2C, deduplicação, histórico, KPIs. Testes de navegador autenticado, dispositivos reais e envio HTTP ainda requerem verificação.
- Política pendente, IDs Ads preservados e desativados, GA4/GTM não configurados. Produção redireciona para galeria até aprovação.
