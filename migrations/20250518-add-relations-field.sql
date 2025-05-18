-- Aggiungo il campo relations alla tabella companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS relations JSONB NOT NULL DEFAULT '[]';

-- Aggiungo un commento alla colonna per documentazione
COMMENT ON COLUMN public.companies.relations IS 'Tag multipli per le relazioni tra utente e azienda';