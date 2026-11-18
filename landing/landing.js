
(function(){
  "use strict";
  const c=window.GF_LANDING_CONFIG, f=document.getElementById("lead-form");if(!c||!f)return;
  const prod=location.hostname==="www.grandfocus.com.br"||location.hostname==="grandfocus.com.br";
  const live=prod&&c.launchApproved;
  const privacy=document.getElementById("consent"),msg=document.getElementById("form-message"),submit=f.querySelector("[type=submit]");
  const prefKey="gf-marketing-consent-v1";let allowed=false,tagReady=false,busy=false,key=null,lastPayload=null,started=false,emitted=new Set();
  const storage={get(k){try{return sessionStorage.getItem(k)}catch{return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch{}}};
  const consentSaved=storage.get(prefKey);
  function enableTag(){
    if(!live||!c.adsEnabled||!allowed||tagReady||f.dataset.funnel!=="b2b")return;
    window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};
    window.gtag("consent","default",{ad_storage:"denied",analytics_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});
    window.gtag("consent","update",{ad_storage:"granted",analytics_storage:"denied",ad_user_data:"granted",ad_personalization:"denied"});
    window.gtag("js",new Date());window.gtag("config",c.adsTag,{send_page_view:false,allow_ad_personalization_signals:false});
    const s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(c.adsTag);document.head.appendChild(s);tagReady=true
  }
  function preference(v){allowed=v;storage.set(prefKey,v?"yes":"no");privacy.hidden=true;if(v)enableTag();else if(tagReady)window.gtag?.("consent","update",{ad_storage:"denied",analytics_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"})}
  if(consentSaved)preference(consentSaved==="yes");else privacy.hidden=true;
  document.getElementById("consent-no").onclick=()=>preference(false);
  document.getElementById("consent-yes").onclick=()=>preference(true);
  document.getElementById("privacy-settings").onclick=()=>{privacy.hidden=false;privacy.scrollIntoView({block:"nearest"})};
  if(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()).replace(/-/g,"")>"20261219"){document.querySelectorAll("[data-seasonal]").forEach(e=>e.textContent="Consulte sua cidade e data.")}
  function event(name,params={}){
    if(!live||!allowed)return;
    // GA4/GTM not installed until verified IDs have been supplied.
    if(c.ga4&&typeof window.gtag==="function")window.gtag("event",name,{funnel:f.dataset.funnel,landing_id:f.dataset.landing,variant_id:f.dataset.variant,offer_type:f.dataset.offer,...params})
  }
  event("gf_landing_view");
  document.querySelectorAll('a[href="#interesse"]').forEach(a=>a.addEventListener("click",()=>event("gf_cta_click")));
  f.addEventListener("input",()=>{if(!started){started=true;event("gf_form_start")}});
  function attribution(){
    if(!allowed)return {};
    const p=new URLSearchParams(location.search),o={};
    for(const k of ["gclid","gbraid","wbraid","utm_source","utm_medium","utm_campaign","utm_content","utm_term","experiment_id","creative_id"]){const v=p.get(k);if(v&&/^[A-Za-z0-9_.~:+ /-]{1,300}$/.test(v))o[k]=v}
    return o
  }
  function notice(s,error=false,success=false){msg.textContent=s;msg.dataset.error=String(error);msg.dataset.success=String(success);msg.focus()}
  const fill=document.getElementById("test-fill"); const submitLabel=submit.textContent;
  if(live){["preview-alert","test-note","test-fill"].forEach(id=>document.getElementById(id).hidden=true);}
  else fill.onclick=()=>{f.elements.name.value="TESTE GF";if(f.elements.school_name)f.elements.school_name.value="ESCOLA TESTE GF";f.elements.city.value="Cidade teste";f.elements.state.value="SP";f.elements.phone.value="11900000000";if(f.elements.role)f.elements.role.value="direcao";if(f.elements.adult_confirmed)f.elements.adult_confirmed.checked=true;if(f.dataset.funnel==="b2c")f.elements.interest_type.value="artistico";if(f.elements.event_date)f.elements.event_date.value="teste";if(f.elements.marketing)f.elements.marketing.checked=false;};
  f.addEventListener("submit",async e=>{
    e.preventDefault();if(busy||!f.reportValidity())return;
    const data=Object.fromEntries(new FormData(f));data.marketing=!!f.elements.marketing?.checked;data.adult_confirmed=!!f.elements.adult_confirmed?.checked;
    const digits=String(data.phone||"").replace(/\D/g,"");const national=(digits.length===12||digits.length===13)&&digits.startsWith("55")?digits.slice(2):digits;
    if(!/^[1-9][1-9]\d{8,9}$/.test(national)){notice("Informe um WhatsApp brasileiro válido com DDD.",true);event("gf_form_error",{code:"validation"});f.elements.phone.focus();return}
    if(!live)data.event_date="teste"; if(f.dataset.funnel==="b2b")data.interest_type=f.dataset.offer; data.phone=national;data.funnel=f.dataset.funnel;data.landing_id=f.dataset.landing;data.variant_id=f.dataset.variant;data.offer_type=f.dataset.offer;data.page_version=c.version;data.policy_version=c.policyVersion;data.measurement=allowed&&live;data.attribution=live?attribution():{};data.test=!live;
    if(!live&&(data.name!=="TESTE GF"||data.phone!=="11900000000"||data.city!=="Cidade teste"||(data.funnel==="b2b"&&data.school_name!=="ESCOLA TESTE GF")||data.notes)){notice("Use apenas os dados fictícios do botão de teste.",true);return}
    const fingerprint=JSON.stringify(data);if(lastPayload!==fingerprint||!key){key=crypto.randomUUID();lastPayload=fingerprint}data.idempotency_key=key;
    busy=true;submit.disabled=true;submit.textContent="Enviando seu interesse…";msg.textContent="";
    try{
      const res=await fetch(c.api,{method:"POST",headers:{"Content-Type":"application/json","apikey":c.publicKey,"Authorization":"Bearer "+c.publicKey},body:JSON.stringify(data)});
      const result=await res.json();if(!res.ok||!result.ok||!result.leadId)throw new Error("api");
      if(result.created){
        if(live&&c.adsEnabled&&allowed&&tagReady&&f.dataset.funnel==="b2b"&&!emitted.has(result.leadId)){
          emitted.add(result.leadId);window.gtag?.("event","conversion",{send_to:c.adsDestination,transaction_id:result.leadId});
        }
        event(f.dataset.funnel==="b2b"?"gf_b2b_lead_success":"gf_b2c_interest_success");
      }
      document.getElementById("form-content").hidden=true;
      const thanks=document.getElementById("thank-you");thanks.hidden=false;
      document.getElementById("success-detail").textContent=!live?"Cadastro fictício confirmado. Nenhuma conversão enviada.":!result.created?"Seu interesse já estava registrado.":"Obrigado pela confiança.";
      const wa=document.getElementById("whatsapp-next");
      if(live&&/^55[1-9][1-9][0-9]{8,9}$/.test(c.whatsapp||"")){wa.href="https://wa.me/"+c.whatsapp;wa.hidden=false}
      thanks.focus();thanks.scrollIntoView({block:"nearest"});
    }catch{event("gf_form_error",{code:"network_or_api"});notice("Não conseguimos registrar seu interesse agora. Confira sua conexão e tente novamente. Seus dados continuam preenchidos.",true)}
    finally{busy=false;submit.disabled=false;submit.textContent=submitLabel}
  });
})();