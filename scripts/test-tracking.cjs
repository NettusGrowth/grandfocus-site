// Deterministic client-side audit: no browser network, no Supabase writes, no Google pings.
// Uses the production landing source with a simulated DOM and API responses.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const routes = [
  ['index.html', 'b2b_spectacle_a', 'a', 'espetaculo'],
  ['bastidores/index.html', 'b2b_backstage', 'original', 'bastidores'],
  ['experiencias/index.html', 'b2b_complementary', 'original', 'outras_experiencias'],
  ['especiais/index.html', 'b2b_special', 'original', 'experiencias_especiais']
];
const originalConfig = fs.readFileSync('dist/landing/config.js', 'utf8');
const originalClient = fs.readFileSync('dist/landing/landing.js', 'utf8');
const allParams = new URLSearchParams({
  gclid:'CLICK123', gbraid:'BRAID123', wbraid:'WBRAID123',
  utm_source:'google', utm_medium:'cpc', utm_campaign:'escolas_nacional',
  utm_content:'criativo_01', utm_term:'foto_danca',
  campaign_id:'CAMPAIGN123', adgroup_id:'ADGROUP123', creative_id:'CREATIVE123'
});
const leadId = '12345678-1234-4123-8123-123456789abc';
let checked = 0;
function check(condition, label) {
  assert.ok(condition, label);
  checked++;
}

function createPage([file, landing, variant, offer], opts = {}) {
  const html = fs.readFileSync('dist/' + file, 'utf8');
  const formMarkup = html.match(/<form\b[^>]*id="lead-form"[^>]*>/)?.[0];
  check(!!formMarkup, file + ' form exists');
  if(!opts.skipDatasetChecks) for (const [key, expected] of Object.entries({funnel:'b2b',landing,variant,offer})) {
    check(formMarkup.includes('data-' + key + '="' + expected + '"'), file + ' data-' + key);
  }
  const callbacks = {};
  const elements = {
    name:{value:'PERSONAGEM FICTICIO'}, school_name:{value:'ESCOLA FICTICIA'},
    phone:{value:opts.phone ?? '11900000000'}, city:{value:'Cidade ficticia'},
    state:{value:'SP'}, role:{value:'direcao'}, notes:{value:''},
    event_date:{value:''}, marketing:{checked:false}
  };
  const submitButton = {textContent:'Quero conhecer a proposta',disabled:false};
  const form = {
    dataset:{funnel:'b2b',landing,variant,offer},
    elements,
    querySelector(){return submitButton;},
    addEventListener(event, callback){callbacks[event]=callback;},
    reportValidity(){return opts.valid !== false;}
  };
  const trackingScripts = [];
  const preference = {hidden:true,classList:{contains(v){return v==='gf-cookie-choice';}},scrollIntoView(){}};
  const elementsById = {
    'lead-form':form,
    consent:preference,
    'form-message':{textContent:'',dataset:{},focus(){}},
    'consent-yes':{},'consent-no':{},'privacy-settings':{},
    'form-content':{hidden:false},
    interesse:{appendChild(){}},
    'thank-you':{hidden:true,focus(){},scrollIntoView(){}},
    'success-detail':{textContent:''},
    'whatsapp-next':{hidden:true,href:''},
    'test-tools':{hidden:true},
    'test-fill':opts.preview ? {hidden:true} : null,
    'test-note':{hidden:true},
    'preview-alert':{hidden:true}
  };
  const requests = [], redirects=[];
  const fakeStorage = new Map();
  const window = {};
  const document = {
    getElementById(key){return elementsById[key]??null;},
    querySelectorAll(){return [];},
    createElement(tag){return {tag,async:false,src:''};},
    head:{appendChild(el){trackingScripts.push(el);}}
  };
  class MockFormData {
    constructor(f){this.fields=Object.fromEntries(Object.entries(f.elements).filter(([,v])=>'value' in v).map(([k,v])=>[k,v.value]));}
    *[Symbol.iterator](){yield* Object.entries(this.fields);}
  }
  const location = {
    hostname:opts.preview?'grandfocus-site-audit-test-nettu-s-projects.vercel.app':'www.grandfocus.com.br',
    search:opts.search ?? '?' + allParams.toString(),
    replace(url){redirects.push(url);}
  };
  const context = {window,document,location,sessionStorage:{
    getItem(key){return fakeStorage.has(key)?fakeStorage.get(key):null;},
    setItem(key,value){fakeStorage.set(key,value);}
  },FormData:MockFormData,URLSearchParams,crypto:{randomUUID(){return '11111111-1111-4111-8111-111111111111';}},
  fetch:async(url,options)=>{
    requests.push({url,payload:JSON.parse(options.body)});
    if(opts.throwNetwork)throw new Error('simulated network error');
    return {ok:opts.httpOk!==false,json:async()=>opts.response ?? {ok:true,created:true,leadId}};
  }};
  vm.runInNewContext(originalConfig,context,{timeout:1000,filename:'landing/config.js'});
  if(opts.savedConsent)fakeStorage.set('gf-marketing-consent-'+window.GF_LANDING_CONFIG.policyVersion,opts.savedConsent);
  vm.runInNewContext(originalClient,context,{timeout:1000,filename:'landing/landing.js'});
  return {
    file,opts,form,callbacks,context,trackingScripts,requests,redirects,elementsById,
    consent(value){elementsById[value?'consent-yes':'consent-no'].onclick();},
    async submit(){if(!callbacks.submit)return;await callbacks.submit({preventDefault(){}});},
    conversions(){return (window.dataLayer||[]).filter(args=>args[0]==='event'&&args[1]==='conversion').map(args=>args[2]);},
    tagConfigs(){return (window.dataLayer||[]).filter(args=>args[0]==='config');},
    consentCalls(){return (window.dataLayer||[]).filter(args=>args[0]==='consent');}
  };
}

async function run(){
  check(originalConfig.includes('adsTag:"AW-11436117910"'),'correct existing Google Ads tag');
  check(originalConfig.includes('adsDestination:"AW-11436117910/Cio6CNyCibsdEJaflc0q"'),'correct existing conversion destination');
  check(originalConfig.includes('ga4:null')&&originalConfig.includes('gtm:null'),'GA4 and GTM disabled pending verification');
  for (const route of routes) {
    let page = createPage(route);
    check(page.trackingScripts.length===0,route[0]+' no tag before consent');
    check(page.conversions().length===0,route[0]+' no conversion on load');
    await page.submit();
    check(page.requests.length===1,route[0]+' refusal/no-choice does not block form');
    check(page.trackingScripts.length===0 && page.conversions().length===0,route[0]+' no unauthorized Google request');
    check(Object.keys(page.requests[0].payload.attribution).length===0,route[0]+' no attribution without consent');

    page=createPage(route,{response:{ok:true,leadId,created:false}});
    page.consent(true);
    await page.submit();
    check(page.requests.length===1,route[0]+' duplicate receives API response');
    check(page.conversions().length===0,route[0]+' duplicate does not convert');

    page=createPage(route,{response:{ok:false,created:true,leadId},httpOk:false});
    page.consent(true);
    await page.submit();
    check(page.conversions().length===0 && !page.elementsById['thank-you'].hidden===false,route[0]+' error does not convert');

    page=createPage(route,{phone:'123'});
    page.consent(true);
    await page.submit();
    check(page.requests.length===0 && page.conversions().length===0,route[0]+' invalid phone does not submit or convert');

    page=createPage(route,{savedConsent:'no'});
    check(page.trackingScripts.length===0 && page.conversions().length===0,route[0]+' stored refusal does not load tag');
    page=createPage(route,{savedConsent:'yes'});
    check(page.trackingScripts.length===1 && page.tagConfigs().length===1,route[0]+' stored consent loads one tag');

    page=createPage(route);
    page.consent(true);
    page.consent(true);
    check(page.trackingScripts.length===1,route[0]+' one injected Google script after repeated accept');
    check(page.tagConfigs().length===1,route[0]+' one Google config after repeated accept');
    check(page.trackingScripts[0].src==='https://www.googletagmanager.com/gtag/js?id=AW-11436117910',route[0]+' exact tag URL');
    check(page.consentCalls().some(args=>args[1]==='default'&&args[2].ad_storage==='denied'),route[0]+' default denied');
    check(page.consentCalls().some(args=>args[1]==='update'&&args[2].ad_storage==='granted'),route[0]+' consent granted');
    await page.submit();
    const result=page.requests[0]?.payload;
    check(page.requests.length===1&&result?.test===false&&result.funnel==='b2b',route[0]+' production B2B API payload');
    check(result.landing_id===route[1]&&result.variant_id===route[2]&&result.offer_type===route[3],route[0]+' attribution to landing');
    check(result.measurement===true,route[0]+' opted-in measurement flag');
    for(const [key,val] of allParams.entries())check(result.attribution[key]===val,route[0]+' preserve '+key);
    const conversions=page.conversions();
    check(conversions.length===1,route[0]+' exactly one post-confirmation conversion');
    check(conversions[0].transaction_id===leadId,route[0]+' lead UUID transaction_id');
    check(conversions[0].send_to==='AW-11436117910/Cio6CNyCibsdEJaflc0q',route[0]+' exact conversion action');
    check(Object.keys(conversions[0]).length===2,route[0]+' no PII in Ads event');
    await page.submit();
    check(page.conversions().length===1,route[0]+' repeated same leadId does not duplicate events');

    page=createPage(route);
    page.consent(true);
    page.consent(false);
    check(page.consentCalls().at(-1)[2].ad_storage==='denied',route[0]+' rejection revokes consent');
    await page.submit();
    check(page.requests.length===1&&page.conversions().length===0,route[0]+' rejection does not block form or convert');
    check(Object.keys(page.requests[0].payload.attribution).length===0,route[0]+' rejection discards click attribution');

    page=createPage(route,{preview:true});
    check(page.trackingScripts.length===0,route[0]+' preview never loads Ads tag');
    page.elementsById['test-fill'].onclick();
    await page.submit();
    check(page.requests.length===1&&page.requests[0].payload.test===true,route[0]+' preview only submits marked test');
    check(page.conversions().length===0&&page.trackingScripts.length===0,route[0]+' preview never converts');
  }
  const creativeTwo=createPage(routes[0],{search:'?utm_source=google&utm_content=criativo_02&creative_id=CREATIVE456'});
  creativeTwo.consent(true);
  await creativeTwo.submit();
  check(creativeTwo.requests[0].payload.attribution.utm_content==='criativo_02', 'second home creative retains utm_content');
  check(creativeTwo.requests[0].payload.attribution.creative_id==='CREATIVE456', 'second home creative retains creative_id');
  check(creativeTwo.conversions().length===1, 'second home creative uses same one B2B conversion');
  const legacy=['escolas/espetaculos/index.html','escolas/espetaculos-b/index.html','escolas/natal/index.html'];
  for(const file of legacy){
    const page=createPage([file,'unsupported','original','espetaculo'],{skipDatasetChecks:true,search:'?gclid=TEST_CLICK&utm_content=criativo_02'});
    check(page.redirects[0]==='/?gclid=TEST_CLICK&utm_content=criativo_02',file+' JS fallback preserves query');
  }
  console.log('PASS: '+checked+' isolated tracking assertions. No real API calls or Google Ads requests.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
