import { pool } from '../db';
import { storage } from '../storage';

export const listLeads = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        first_name     AS "firstName",
        last_name      AS "lastName",
        company_name   AS company,
        company_email  AS "companyEmail",
        private_email  AS "privateEmail",
        mobile_phone   AS "mobilePhone",
        office_phone   AS "officePhone",
        private_phone  AS "privatePhone",
        status,
        created_at     AS "createdAt",
        updated_at     AS "updatedAt"
      FROM leads
      ORDER BY id DESC
    `);
    
    // Mappiamo i campi per compatibilità con il frontend
    const mappedRows = rows.map(row => ({
      ...row,
      email: row.companyEmail || row.privateEmail,
      phone: row.mobilePhone || row.officePhone || row.privatePhone
    }));
    
    res.json(mappedRows);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei lead' });
  }
};

export const getLead = async (req, res, next) => {
  try {
    console.log('Fetching lead with id:', req.params.id);
    
    // Prendiamo tutti i campi dalla tabella per evitare errori di mappatura
    const { rows } = await pool.query(`
      SELECT * 
      FROM leads
      WHERE id = $1
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lead non trovato' });
    }
    
    const lead = rows[0];
    console.log('Lead found:', lead);
    
    // Mappiamo i campi per compatibilità con il frontend
    const mappedLead = {
      id: lead.id,
      firstName: lead.first_name,
      lastName: lead.last_name,
      company: lead.company_name,
      companyName: lead.company_name,
      companyEmail: lead.company_email,
      privateEmail: lead.private_email,
      mobilePhone: lead.mobile_phone,
      officePhone: lead.office_phone,
      privatePhone: lead.private_phone,
      role: lead.role,
      jobTitle: lead.role, // Alias per compatibilità
      status: lead.status,
      notes: lead.notes,
      source: lead.source,
      tags: lead.tags ? (Array.isArray(lead.tags) ? lead.tags : [lead.tags]) : [],
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      email: lead.email || lead.company_email || lead.private_email,
      phone: lead.phone || lead.mobile_phone || lead.office_phone || lead.private_phone
    };
    
    console.log('Mapped lead:', mappedLead);
    
    res.json(mappedLead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ message: 'Errore durante il recupero del lead' });
  }
};

export const createLead = async (req, res, next) => {
  try {
    // Estrai tutti i campi rilevanti dal body
    const { 
      firstName, 
      lastName, 
      company, 
      companyEmail,
      privateEmail,
      email, // Campo generico "email" usato dal frontend
      mobilePhone,
      officePhone, 
      privatePhone,
      phone, // Campo generico "phone" usato dal frontend
      status,
      notes
    } = req.body;
    
    console.log('CREATE LEAD - Request body:', req.body);
    
    // Determiniamo quali email salvare nel DB (company_email o private_email)
    // Priorità: 1) campi specifici (companyEmail/privateEmail), 2) campo generico (email)
    let finalCompanyEmail = companyEmail || null;
    let finalPrivateEmail = privateEmail || null;
    
    // Se è stata fornita solo l'email generica, decidiamo dove metterla
    if (email && !finalCompanyEmail && !finalPrivateEmail) {
      // Se l'email contiene il nome dell'azienda, la consideriamo aziendale
      if (company && email.includes('@' + company.toLowerCase().replace(/\s/g, ''))) {
        finalCompanyEmail = email;
      } else {
        // Altrimenti la consideriamo privata
        finalPrivateEmail = email;
      }
    }
    
    // Trattiamo il telefono in modo flessibile
    const finalMobilePhone = mobilePhone || phone || null;
    const finalOfficePhone = officePhone || null;
    const finalPrivatePhone = privatePhone || null;
    
    // Data di creazione e aggiornamento
    const now = new Date();
    
    // Query SQL - usiamo solo i nomi di colonna che esistono nel DB
    const queryText = `
      INSERT INTO leads
        (first_name, last_name, company_name, company_email, private_email, 
         mobile_phone, office_phone, private_phone, status, notes, created_at, updated_at)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING
        id,
        first_name     AS "firstName",
        last_name      AS "lastName",
        company_name   AS company,
        company_email  AS "companyEmail",
        private_email  AS "privateEmail",
        mobile_phone   AS "mobilePhone",
        office_phone   AS "officePhone",
        private_phone  AS "privatePhone",
        status,
        notes,
        created_at     AS "createdAt",
        updated_at     AS "updatedAt"
    `;
    
    const queryParams = [
      firstName, 
      lastName, 
      company, 
      finalCompanyEmail, 
      finalPrivateEmail, 
      finalMobilePhone,
      finalOfficePhone,
      finalPrivatePhone,
      status || 'new',
      notes || null,
      now,
      now
    ];
    
    console.log('CREATE LEAD SQL:', queryText);
    console.log('CREATE LEAD PARAMS:', queryParams);
    
    const { rows } = await pool.query(queryText, queryParams);
    
    // Mappiamo i campi per la risposta al frontend, aggiungendo i campi virtuali 
    // "email" e "phone" per compatibilità
    const mappedLead = {
      ...rows[0],
      email: rows[0].companyEmail || rows[0].privateEmail,
      phone: rows[0].mobilePhone || rows[0].officePhone || rows[0].privatePhone
    };
    
    res.status(201).json(mappedLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Errore durante la creazione del lead' });
  }
};

export const updateLead = async (req, res, next) => {
  try {
    console.log('UPDATE LEAD:', req.params.id, req.body);
    
    // Usiamo il metodo updateLead dallo storage
    const updatedLead = await storage.updateLead(+req.params.id, req.body);
    
    if (!updatedLead) {
      return res.status(404).json({ message: 'Lead non trovato' });
    }
    
    res.status(200).json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ message: 'Errore durante l\'aggiornamento del lead' });
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM leads WHERE id = $1', [req.params.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Lead non trovato' });
    }
    
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: 'Errore durante la cancellazione del lead' });
  }
};

export const convertLead = async (req, res, next) => {
  try {
    const id = req.params.id;
    
    // 1. Get the lead
    const { rows: leadRows } = await pool.query(`
      SELECT
        id,
        first_name     AS "firstName",
        last_name      AS "lastName",
        company_name   AS company,
        company_email  AS "companyEmail",
        private_email  AS "privateEmail",
        mobile_phone   AS "mobilePhone",
        office_phone   AS "officePhone",
        private_phone  AS "privatePhone",
        status,
        notes
      FROM leads
      WHERE id = $1
    `, [id]);
    
    if (leadRows.length === 0) {
      return res.status(404).json({ message: 'Lead non trovato' });
    }
    
    const lead = leadRows[0];
    
    // Prepariamo email e telefono per la conversione
    const email = lead.companyEmail || lead.privateEmail || null;
    const phone = lead.mobilePhone || lead.officePhone || lead.privatePhone || null;
    
    // 2. Create company if needed
    let companyId = null;
    if (lead.company) {
      const { rows: companyRows } = await pool.query(`
        INSERT INTO companies (name)
        VALUES ($1)
        RETURNING id
      `, [lead.company]);
      
      companyId = companyRows[0].id;
    }
    
    // 3. Create contact
    const { rows: contactRows } = await pool.query(`
      INSERT INTO contacts (first_name, last_name, email, phone, company_id, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [lead.firstName, lead.lastName, email, phone, companyId, lead.notes]);
    
    // 4. Update lead status
    await pool.query(`
      UPDATE leads
      SET status = 'converted'
      WHERE id = $1
    `, [id]);
    
    // 5. Return result
    res.json({
      companyId,
      contact: contactRows[0]
    });
  } catch (error) {
    console.error('Error converting lead:', error);
    res.status(500).json({ message: 'Errore durante la conversione del lead' });
  }
};
