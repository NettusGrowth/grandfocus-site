-- V2: only acquisition table, access policy unchanged
alter table public.gf_marketing_leads add column if not exists history jsonb not null default '[]'::jsonb;
alter table public.gf_marketing_leads add column if not exists proposed_at timestamptz;
create or replace function public.gf_marketing_history() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 new.updated_at=now();
 if new.status is distinct from old.status then
  if new.status in ('qualificado','reuniao','proposta','fechado') then new.qualified_at=coalesce(new.qualified_at,now()); end if;
  if new.status in ('proposta','fechado','proposta_enviada','reserva_confirmada') then new.proposed_at=coalesce(new.proposed_at,now()); end if;
  if new.status in ('fechado','reserva_confirmada') then new.won_at=coalesce(new.won_at,now()); end if;
 end if;
 if (new.status,new.followup_note,new.next_followup_at,new.last_contact_at) is distinct from (old.status,old.followup_note,old.next_followup_at,old.last_contact_at) then
  new.history=old.history||jsonb_build_array(jsonb_build_object('at',now(),'status',new.status,'note',case when new.followup_note is distinct from old.followup_note then new.followup_note else null end,'next',new.next_followup_at,'contact',new.last_contact_at is distinct from old.last_contact_at));
 end if;
 return new;
end $$;
revoke all on function public.gf_marketing_history() from public,anon,authenticated;
create trigger gf_marketing_history_v2 before update on public.gf_marketing_leads for each row execute function public.gf_marketing_history();
create or replace function public.gf_marketing_stats(p_funnel text,p_test boolean) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('total',count(*),'latest',max(created_at),'novos',count(*) filter(where status in ('novo','lista_interesse') and last_contact_at is null),'contatos',count(*) filter(where last_contact_at is not null),'qualificados',count(*) filter(where qualified_at is not null or status in ('qualificado','reuniao','proposta','fechado')),'propostas',count(*) filter(where proposed_at is not null or status in ('proposta','fechado','proposta_enviada','reserva_confirmada')),'fechamentos',count(*) filter(where won_at is not null or status in ('fechado','reserva_confirmada'))) from public.gf_marketing_leads where funnel=p_funnel and is_test=p_test
$$;
revoke all on function public.gf_marketing_stats(text,boolean) from public,anon,authenticated;
grant execute on function public.gf_marketing_stats(text,boolean) to authenticated;
