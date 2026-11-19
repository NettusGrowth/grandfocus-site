-- Additive change, isolated to the acquisition table. Preserve historical identifiers.
BEGIN;
ALTER TABLE public.gf_marketing_leads DROP CONSTRAINT gf_marketing_leads_landing_id_check;
ALTER TABLE public.gf_marketing_leads ADD CONSTRAINT gf_marketing_leads_landing_id_check CHECK (landing_id IN ('b2b_spectacle_a','b2b_spectacle_b','b2b_school_christmas','b2c_dance_interest','b2b_backstage','b2b_complementary','b2b_special'));
COMMIT;
