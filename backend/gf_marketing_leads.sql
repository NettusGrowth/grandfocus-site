-- Isolated acquisition infrastructure; no changes to gallery tables or policies.
create table public.gf_marketing_leads (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 idempotency_key uuid not null unique,
 fingerprint text not null,
 is_test boolean not null default true,
 funnel text not null check(funnel in ('b2b','b2c')),
 landing_id text not null check(landing_id in ('b2b_spectacle_a','b2b_spectacle_b','b2b_school_christmas','b2c_dance_interest')),
 variant_id text not null, offer_type text not null, page_version text not null,
 name text not null check(length(name) between 2 and 100),
 phone_normalized text not null check(phone_normalized ~ '^[1-9][1-9][0-9]{8,9}$'),
 school_name text, role text, city text not null, state text not null, event_date text, student_count_range text,
 interest_type text not null, notes text, adult_confirmed boolean not null default false,
 attribution jsonb not null default '{}'::jsonb, measurement boolean not null default false, marketing boolean not null default false, policy_version text not null,
 status text not null check(status in ('novo','em_contato','qualificado','reuniao','proposta','fechado','perdido','sem_retorno','invalido','lista_interesse','proposta_enviada','reserva_confirmada')),
 followup_note text, next_followup_at date, assigned_to uuid, last_contact_at timestamptz,
 qualified_at timestamptz, meeting_at timestamptz, won_at timestamptz, loss_reason text,
 check((funnel='b2b' and school_name is not null and role is not null) or (funnel='b2c' and adult_confirmed and school_name is null and role is null))
);
create index gf_marketing_leads_fingerprint on public.gf_marketing_leads(fingerprint,is_test,created_at desc);
create index gf_marketing_leads_dashboard on public.gf_marketing_leads(funnel,status,created_at desc);
alter table public.gf_marketing_leads enable row level security;
revoke all on public.gf_marketing_leads from public, anon, authenticated;
grant select on public.gf_marketing_leads to authenticated;
grant update(status,followup_note,next_followup_at,assigned_to,last_contact_at,qualified_at,meeting_at,won_at,loss_reason,updated_at) on public.gf_marketing_leads to authenticated;
grant select,insert,update,delete on public.gf_marketing_leads to service_role;
create policy gf_marketing_super_admin_read on public.gf_marketing_leads for select to authenticated using(exists(select 1 from public.perfis p where p.user_id=(select auth.uid()) and p.role='super_admin'));
create policy gf_marketing_super_admin_update on public.gf_marketing_leads for update to authenticated using(exists(select 1 from public.perfis p where p.user_id=(select auth.uid()) and p.role='super_admin')) with check(exists(select 1 from public.perfis p where p.user_id=(select auth.uid()) and p.role='super_admin'));
create or replace function public.gf_marketing_register(p jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare existing public.gf_marketing_leads%rowtype; out_id uuid; fp text; test boolean; req uuid;
begin
 test := (p->>'test')::boolean;
 req := (p->>'idempotency_key')::uuid;
 fp := md5(concat_ws('|',p->>'funnel',lower(trim(coalesce(p->>'school_name',''))),p->>'phone',p->>'interest_type',lower(trim(coalesce(p->>'event_date','')))));
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gfmarketing:'||test::text,0));
 select * into existing from public.gf_marketing_leads where idempotency_key=req;
 if found then
   if existing.fingerprint <> fp or existing.is_test <> test then return jsonb_build_object('ok',false,'code','key_conflict'); end if;
   return jsonb_build_object('ok',true,'leadId',existing.id,'created',false);
 end if;
 select * into existing from public.gf_marketing_leads where fingerprint=fp and is_test=test and created_at>now()-interval '24 hours' order by created_at desc limit 1;
 if found then return jsonb_build_object('ok',true,'leadId',existing.id,'created',false); end if;
 if (select count(*) from public.gf_marketing_leads where is_test=test and created_at>now()-interval '1 minute')>=20
 or (select count(*) from public.gf_marketing_leads where phone_normalized=p->>'phone' and is_test=test and created_at>now()-interval '1 hour')>=5 then
   return jsonb_build_object('ok',false,'code','rate_limit');
 end if;
 insert into public.gf_marketing_leads(idempotency_key,fingerprint,is_test,funnel,landing_id,variant_id,offer_type,page_version,name,phone_normalized,school_name,role,city,state,event_date,student_count_range,interest_type,notes,adult_confirmed,attribution,measurement,marketing,policy_version,status)
 values(req,fp,test,p->>'funnel',p->>'landing_id',p->>'variant_id',p->>'offer_type',p->>'page_version',p->>'name',p->>'phone',nullif(p->>'school_name',''),nullif(p->>'role',''),p->>'city',p->>'state',nullif(p->>'event_date',''),nullif(p->>'student_count_range',''),p->>'interest_type',nullif(p->>'notes',''),coalesce((p->>'adult_confirmed')::boolean,false),coalesce(p->'attribution','{}'::jsonb),coalesce((p->>'measurement')::boolean,false),coalesce((p->>'marketing')::boolean,false),p->>'policy_version',case when p->>'funnel'='b2b' then 'novo' else 'lista_interesse' end)
 returning id into out_id;
 return jsonb_build_object('ok',true,'leadId',out_id,'created',true);
end $$;
revoke all on function public.gf_marketing_register(jsonb) from public,anon,authenticated;
grant execute on function public.gf_marketing_register(jsonb) to service_role;
