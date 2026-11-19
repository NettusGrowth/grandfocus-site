const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const cfgContext={window:{}};vm.runInNewContext(fs.readFileSync('landing/config.js','utf8'),cfgContext);const config=cfgContext.window.GF_LANDING_CONFIG;
const source=fs.readFileSync('landing/landing.js','utf8');
const cases=[['index.html','b2b_spectacle_a','a','espetaculo'],['bastidores/index.html','b2b_backstage','original','bastidores'],['experiencias/index.html','b2b_complementary','original','outras_experiencias'],['especiais/index.html','b2b_special','original','experiencias_especiais']];
function model([path,id,variant,offer],{live=true,allow=false,created=true,fail=false,creative='criativo_01'}={}){
 const nodes={},mk=()=>({hidden:false,textContent:'',dataset:{},addEventListener(ev,cb){this[ev]=cb},focus(){},scrollIntoView(){},appendChild(){}});const get=id=>nodes[id]??=mk();
 const f=get('lead-form'),submit=mk(),window={GF_LANDING_CONFIG:config},storage=new Map(),calls=[],loaded=[];
 f.dataset={landing:id,variant,offer,funnel:'b2b'};f.querySelector=()=>submit;f.reportValidity=()=>true;
 f.elements=Object.fromEntries(['name','phone','city','state','school_name','role','event_date','interest_type','website'].map(k=>[k,{value:'',focus(){}}]));
 const formData={name:live?'CENARIO CONTROLADO':'TESTE GF',phone:live?'34999999999':'11900000000',city:live?'Cidade de validação':'Cidade teste',state:'SP',school_name:live?'ESCOLA VALIDACAO':'ESCOLA TESTE GF',role:'direcao',event_date:'teste',interest_type:offer,website:''};
 const document={getElementById:get,querySelectorAll:()=>[],createElement:()=>mk(),head:{appendChild(n){loaded.push(n.src)}}};
 const location={hostname:live?'www.grandfocus.com.br':'grandfocus-site-on5ehaviq-nettu-s-projects.vercel.app',search:'?utm_source=google&utm_content='+creative+'&creative_id=12345&gclid=FAKE_TEST_ID',replace(){throw Error('unexpected redirect')}};
 const context={window,document,location,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},Intl,Date,URLSearchParams,FormData:class{constructor(){return Object.entries(formData)}},crypto:{randomUUID},fetch:async(url,opts)=>{calls.push(JSON.parse(opts.body));return {ok:!fail,json:async()=>({ok:!fail,created,leadId:'fake-id'})}}};
 vm.runInNewContext(source,context);assert.equal(loaded.length,0,'no tag before choice');
 if(allow)get('consent-yes').onclick();else get('consent-no').onclick();
 return {window,loaded,calls,nodes,get,submit:()=>f.submit({preventDefault(){}}),live,allow,created,fail,id,offer,creative};
}
async function main(){
 for(const c of cases){const h=fs.readFileSync(c[0],'utf8');assert.ok(h.includes('data-landing="'+c[1]+'"'));assert.ok(h.includes('gf-integrated-brand'));assert.ok(h.includes('spectacle-carousel.css?v=4'));for(const field of ['name','school_name','phone','city','state','role','event_date'])assert.ok(h.includes('name="'+field+'"'));assert.ok(!h.includes("Acessar galeria de fotos"));
 for(const opts of [{allow:true},{allow:false},{allow:true,created:false},{allow:true,fail:true},{live:false,allow:true},{allow:true,creative:'criativo_02'}]){const m=model(c,opts);if(!m.live||!m.allow)assert.equal(m.loaded.length,0);await m.submit();assert.equal(m.calls.length,1);const p=m.calls[0];assert.equal(p.landing_id,c[1]);assert.equal(p.offer_type,c[3]);assert.equal(p.test,!m.live);assert.equal(p.measurement,m.live&&m.allow);assert.equal(p.attribution.utm_content,m.live&&m.allow?m.creative:undefined);const conversions=(m.window.dataLayer||[]).filter(e=>e[0]==='event'&&e[1]==='conversion');assert.equal(conversions.length,m.live&&m.allow&&m.created&&!m.fail?1:0);if(conversions.length)assert.equal(conversions[0][2].send_to,config.adsDestination);}
 const revoked=model(c,{allow:true});revoked.get('consent-no').onclick();await revoked.submit();assert.equal(revoked.calls[0].measurement,false);assert.equal((revoked.window.dataLayer||[]).filter(e=>e[0]==='event'&&e[1]==='conversion').length,0);
 console.log('GF FRONTEND OK: '+c[1]+' (mocked consent/conversion/duplicate/error/creative variants)');
 }
 const origin='https://grandfocus-site-on5ehaviq-nettu-s-projects.vercel.app';
 const headers={'Content-Type':'application/json',apikey:config.publicKey,Authorization:'Bearer '+config.publicKey,Origin:origin};
 const req=async(p,originOverride=origin)=>{const r=await fetch(config.api,{method:'POST',headers:{...headers,Origin:originOverride},body:JSON.stringify(p),signal:AbortSignal.timeout(12000)});return {status:r.status,data:await r.json()}};
 for(let i=0;i<cases.length;i++){const c=cases[i];const p={funnel:'b2b',landing_id:c[1],variant_id:c[2],offer_type:c[3],name:'TESTE GF',phone:'11900000000',city:'Cidade teste',state:'SP',school_name:'ESCOLA TESTE GF',role:'direcao',event_date:'teste',interest_type:c[3],page_version:config.version,policy_version:config.policyVersion,test:true,idempotency_key:'e8111900-0000-4000-8000-00000000000'+(i+1),adult_confirmed:false,marketing:true,measurement:true,attribution:{gclid:'FAKE_TEST_CLICK',utm_content:'test'}};
 const a=await req(p);assert.equal(a.status,200,'live preview '+c[1]+' status '+a.status+' '+JSON.stringify(a.data));assert.equal(a.data.ok,true);const again=await req(p);assert.equal(again.status,200);assert.equal(again.data.created,false);assert.equal(again.data.leadId,a.data.leadId);
 const malformed=await req({...p,phone:'x'});assert.equal(malformed.status,400);if(i===0){assert.equal((await req(p,'https://www.grandfocus.com.br')).status,403);assert.equal((await req(p,'https://example.invalid')).status,403)}
 console.log('GF HTTP OK: '+c[1]+' (valid fake registration, idempotency, invalid phone rejected)');
 }
 console.log('GF SMOKE PASS: 4 route forms, frontend simulation, 4 real preview API registrations; no Google Ads request.');
}
main().catch(e=>{console.error('GF SMOKE FAILED:',e.message);process.exitCode=1});