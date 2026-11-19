// Deployment remains test-only until explicit launch prerequisites are satisfied.
const PRODUCTION=false;
const allowedPreview=/^https:\/\/grandfocus-site-[a-z0-9-]+-nettu-s-projects\.vercel\.app$/;
const mapping={b2b_spectacle_a:["b2b","a","espetaculo"],b2b_spectacle_b:["b2b","b","espetaculo"],b2b_school_christmas:["b2b","original","natal_escola"],b2c_dance_interest:["b2c","original","ensaio_danca"]};
function validate(data,test){
 if(!data||typeof data!=="object"||data.website)return null;
 const meta=mapping[data.landing_id];if(!meta||data.funnel!==meta[0]||data.variant_id!==meta[1]||data.offer_type!==meta[2])return null;
 const str=(v,max)=>typeof v==="string"&&v.trim().length<=max?v.trim():"";
 const out={funnel:meta[0],variant_id:meta[1],offer_type:meta[2],landing_id:data.landing_id,name:str(data.name,100),phone:str(data.phone,13),city:str(data.city,100),state:str(data.state,2),school_name:str(data.school_name,150),role:str(data.role,30),event_date:str(data.event_date,100),student_count_range:str(data.student_count_range,50),interest_type:str(data.interest_type,40),notes:str(data.notes,1000),page_version:data.page_version==="2026-11-18.2"?"2026-11-18.2":"2026-11-18.1",policy_version:"draft-2026-11-18",test,idempotency_key:str(data.idempotency_key,36),adult_confirmed:data.adult_confirmed===true,marketing:!test&&data.marketing===true,measurement:!test&&data.measurement===true,attribution:{}};
 if(out.name.length<2||out.city.length<2||!/^[1-9][1-9][0-9]{8,9}$/.test(out.phone)||!/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(out.state)||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(out.idempotency_key))return null;
 if(out.funnel==="b2b"){if(out.page_version==="2026-11-18.2")out.interest_type=meta[2];if(out.school_name.length<2||!["proprietaria","direcao","coordenacao","outra"].includes(out.role)||!["espetaculo","natal_escola","outras_experiencias"].includes(out.interest_type))return null}
 else{if(!out.adult_confirmed||!["artistico","primeira_sapatilha","portfolio","outro"].includes(out.interest_type))return null;out.school_name="";out.role="";out.student_count_range=""}
 if(test){if(out.name!=="TESTE GF"||out.city!=="Cidade teste"||out.phone!=="11900000000"||(out.funnel==="b2b"&&out.school_name!=="ESCOLA TESTE GF")||out.notes||out.event_date!=="teste"||out.student_count_range)return null}
 if(out.measurement&&data.attribution&&typeof data.attribution==="object"){for(const k of ["gclid","gbraid","wbraid","utm_source","utm_medium","utm_campaign","utm_content","utm_term","experiment_id","creative_id"]){const v=data.attribution[k];if(typeof v==="string"&&/^[A-Za-z0-9_.~:+ /-]{1,300}$/.test(v))out.attribution[k]=v}}
 return out
}
Deno.serve(async req=>{
 const origin=req.headers.get("origin")||"";
 const preview=allowedPreview.test(origin), live=PRODUCTION&&origin==="https://www.grandfocus.com.br";
 const headers={"content-type":"application/json","cache-control":"no-store","vary":"Origin","access-control-allow-origin":preview||live?origin:"null","access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"authorization, apikey, content-type"};
 const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(!preview&&!live)return response({ok:false,code:"origin"},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return response({ok:false},405);
 if(!req.headers.get("content-type")?.startsWith("application/json"))return response({ok:false},415);
 try{
  const reader=req.body?.getReader();if(!reader)return response({ok:false},400);
  const dec=new TextDecoder();let body="",size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>12000){await reader.cancel();return response({ok:false},413)}body+=dec.decode(value,{stream:true})}body+=dec.decode();
  const validated=validate(JSON.parse(body),!live);if(!validated)return response({ok:false,code:"validation"},400);
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!key)return response({ok:false},503);
  const res=await fetch(url+"/rest/v1/rpc/gf_marketing_register",{method:"POST",headers:{"apikey":key,"authorization":"Bearer "+key,"content-type":"application/json"},body:JSON.stringify({p:validated})});
  if(!res.ok)return response({ok:false,code:"storage"},503);
  const result=await res.json();return response(result,result.ok?200:result.code==="rate_limit"?429:409);
 }catch{return response({ok:false,code:"request"},400)}
});
