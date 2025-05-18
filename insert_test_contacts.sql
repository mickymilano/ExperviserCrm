-- Script SQL per inserire 30 contatti di test
DO $$
DECLARE
    i INTEGER;
    first_names TEXT[] := ARRAY['Marco', 'Luca', 'Giuseppe', 'Paolo', 'Andrea', 'Francesca', 'Anna', 'Maria', 'Chiara', 'Alessia', 'Sofia', 'Giulia', 'Matteo', 'Francesco', 'Davide', 'Elena', 'Laura', 'Sara', 'Valentina', 'Roberta'];
    last_names TEXT[] := ARRAY['Rossi', 'Bianchi', 'Verdi', 'Ferrari', 'Russo', 'Esposito', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi'];
    domain_names TEXT[] := ARRAY['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'libero.it', 'virgilio.it'];
    company_domains TEXT[] := ARRAY['azienda.it', 'company.com', 'enterprise.eu', 'business.it', 'corporate.com', 'tech.com'];
    addresses TEXT[] := ARRAY[
        'Via Roma 123, Milano, Italia',
        'Corso Dante 45, Roma, Italia',
        'Piazza Garibaldi 67, Napoli, Italia',
        'Viale Mazzini 89, Torino, Italia',
        'Largo Verdi 12, Bologna, Italia',
        'Via Cavour 34, Firenze, Italia',
        'Corso Colombo 56, Genova, Italia',
        'Piazza Leonardo 78, Palermo, Italia',
        'Viale Marconi 90, Bari, Italia',
        'Largo Galilei 23, Venezia, Italia'
    ];
    phone_prefixes TEXT[] := ARRAY['+39 3', '+39 33', '+39 34', '+39 35', '+39 36', '+39 37'];
    landline_prefixes TEXT[] := ARRAY['+39 0', '+39 01', '+39 02', '+39 03', '+39 04', '+39 05'];
    tag_options TEXT[] := ARRAY['vip', 'prospect', 'cliente', 'fornitore', 'partner', 'influencer', 'decisore', 'tecnico', 'finanza', 'marketing', 'vendite'];
    
    -- Variabili per ogni contatto
    first_name TEXT;
    middle_name TEXT;
    last_name TEXT;
    company_email TEXT;
    private_email TEXT;
    mobile_phone TEXT;
    office_phone TEXT;
    address TEXT;
    birthday DATE;
    tags TEXT[];
    notes TEXT;
    status TEXT;
    has_middle_name BOOLEAN;
    tag_count INTEGER;
    random_index INTEGER;
    phone_number TEXT;
    landline_number TEXT;
BEGIN
    FOR i IN 1..30 LOOP
        -- Genera nome e cognome casuali
        random_index := floor(random() * array_length(first_names, 1)) + 1;
        first_name := first_names[random_index];
        
        random_index := floor(random() * array_length(last_names, 1)) + 1;
        last_name := last_names[random_index];
        
        -- Decide se aggiungere un secondo nome
        has_middle_name := random() > 0.7;
        IF has_middle_name THEN
            random_index := floor(random() * array_length(first_names, 1)) + 1;
            middle_name := first_names[random_index];
        ELSE
            middle_name := NULL;
        END IF;
        
        -- Genera email personale
        random_index := floor(random() * array_length(domain_names, 1)) + 1;
        private_email := lower(first_name) || '.' || lower(last_name) || '@' || domain_names[random_index];
        
        -- Genera email aziendale
        random_index := floor(random() * array_length(company_domains, 1)) + 1;
        company_email := lower(first_name) || '.' || lower(last_name) || '@' || company_domains[random_index];
        
        -- Genera numeri di telefono
        random_index := floor(random() * array_length(phone_prefixes, 1)) + 1;
        phone_number := floor(random() * 90000000 + 10000000);
        mobile_phone := phone_prefixes[random_index] || phone_number;
        
        random_index := floor(random() * array_length(landline_prefixes, 1)) + 1;
        landline_number := floor(random() * 9000000 + 1000000);
        office_phone := landline_prefixes[random_index] || landline_number;
        
        -- Seleziona un indirizzo casuale
        random_index := floor(random() * array_length(addresses, 1)) + 1;
        address := addresses[random_index];
        
        -- Genera una data di nascita casuale se necessario
        IF random() > 0.5 THEN
            birthday := '1970-01-01'::DATE + (random() * 365 * 40)::INTEGER;
        ELSE
            birthday := NULL;
        END IF;
        
        -- Genera tag casuali
        tag_count := floor(random() * 3) + 1;
        tags := ARRAY[]::TEXT[];
        FOR j IN 1..tag_count LOOP
            random_index := floor(random() * array_length(tag_options, 1)) + 1;
            -- Aggiungi il tag solo se non è già presente
            IF NOT (tag_options[random_index] = ANY(tags)) THEN
                tags := array_append(tags, tag_options[random_index]);
            END IF;
        END LOOP;
        
        -- Genera note casuali
        IF random() > 0.3 THEN
            notes := 'Note di contatto per ' || first_name || ' ' || last_name || '. Questo è un contatto di test.';
        ELSE
            notes := NULL;
        END IF;
        
        -- Stato del contatto
        IF random() > 0.1 THEN
            status := 'active';
        ELSE
            status := 'inactive';
        END IF;
        
        -- Inserisci il contatto nel database
        INSERT INTO contacts (
            first_name, middle_name, last_name, 
            company_email, private_email,
            mobile_phone, office_phone,
            tags, notes, status,
            created_at, updated_at
        ) VALUES (
            first_name, middle_name, last_name,
            company_email, private_email,
            mobile_phone, office_phone,
            tags, notes, status,
            now(), now()
        );
        
        RAISE NOTICE 'Contatto % creato: % %', i, first_name, last_name;
    END LOOP;
    
    RAISE NOTICE 'Creazione di 30 contatti completata con successo!';
END $$;