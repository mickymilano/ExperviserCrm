import { pool } from '../db';

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
        notes,
        created_at     AS "createdAt",
        updated_at     AS "updatedAt"
      FROM leads
      WHERE id = $1
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lead non trovato' });
    }
    
    // Mappiamo i campi per compatibilità con il frontend
    const mappedLead = {
      ...rows[0],
      email: rows[0].companyEmail || rows[0].privateEmail,
      phone: rows[0].mobilePhone || rows[0].officePhone || rows[0].privatePhone
    };
    
    res.json(mappedLead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ message: 'Errore durante il recupero del lead' });
  }
};

export const createLead = async (req, res, next) => {
  try {
    const { 
      firstName, 
      lastName, 
      company, 
      companyEmail,
      privateEmail,
      email, // Supportiamo sia email generico che campi specifici 
      mobilePhone,
      officePhone, 
      privatePhone,
      phone, // Supportiamo sia phone generico che campi specifici
      status,
      notes
    } = req.body;
    
    console.log('CREATE LEAD - Request body:', req.body);
    
    // Determiniamo il tipo di email (aziendale o privata)
    let finalCompanyEmail = companyEmail || null;
    let finalPrivateEmail = privateEmail || null;
    
    // Se è stata fornita una email generica, la gestiamo
    if (email && !finalCompanyEmail && !finalPrivateEmail) {
      if (company && email.includes('@' + company.toLowerCase().replace(/\s/g, ''))) {
        finalCompanyEmail = email;
      } else {
        finalPrivateEmail = email;
      }
    }
    
    // Trattiamo il telefono in modo flessibile
    const finalMobilePhone = mobilePhone || phone || null;
    const finalOfficePhone = officePhone || null;
    const finalPrivatePhone = privatePhone || null;
    
    // Data di creazione e aggiornamento
    const now = new Date();
    
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
    
    // Mappiamo i campi per compatibilità con il frontend
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
    const id = req.params.id;
    const updates = req.body;
    
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (updates.firstName !== undefined) {
      fields.push(`first_name=$${paramIndex++}`);
      values.push(updates.firstName);
    }
    
    if (updates.lastName !== undefined) {
      fields.push(`last_name=$${paramIndex++}`);
      values.push(updates.lastName);
    }
    
    if (updates.company !== undefined) {
      fields.push(`company_name=$${paramIndex++}`);
      values.push(updates.company);
    }
    
    // Gestione email (decidiamo se aziendali o private)
    if (updates.companyEmail !== undefined) {
      fields.push(`company_email=$${paramIndex++}`);
      values.push(updates.companyEmail);
    }
    
    if (updates.privateEmail !== undefined) {
      fields.push(`private_email=$${paramIndex++}`);
      values.push(updates.privateEmail);
    }
    
    // Supporto per email generico (mantenere compatibilità con frontend)
    if (updates.email !== undefined) {
      if (updates.company && updates.email.includes('@' + updates.company.toLowerCase().replace(/\s/g, ''))) {
        fields.push(`company_email=$${paramIndex++}`);
        values.push(updates.email);
        fields.push(`private_email=NULL`);
      } else {
        fields.push(`private_email=$${paramIndex++}`);
        values.push(updates.email);
        fields.push(`company_email=NULL`);
      }
    }
    
    // Gestione telefono con vari tipi
    if (updates.mobilePhone !== undefined) {
      fields.push(`mobile_phone=$${paramIndex++}`);
      values.push(updates.mobilePhone);
    }
    
    if (updates.officePhone !== undefined) {
      fields.push(`office_phone=$${paramIndex++}`);
      values.push(updates.officePhone);
    }
    
    if (updates.privatePhone !== undefined) {
      fields.push(`private_phone=$${paramIndex++}`);
      values.push(updates.privatePhone);
    }
    
    // Supporto per phone generico (mantenere compatibilità con frontend)
    if (updates.phone !== undefined && 
        updates.mobilePhone === undefined && 
        updates.officePhone === undefined && 
        updates.privatePhone === undefined) {
      fields.push(`mobile_phone=$${paramIndex++}`);
      values.push(updates.phone);
    }
    
    if (updates.status !== undefined) {
      fields.push(`status=$${paramIndex++}`);
      values.push(updates.status);
    }
    
    if (updates.notes !== undefined) {
      fields.push(`notes=$${paramIndex++}`);
      values.push(updates.notes);
    }
    
    // Aggiornamento data di modifica
    fields.push(`updated_at=$${paramIndex++}`);
    values.push(new Date());
    
    if (fields.length === 0) {
      return res.status(400).json({ message: 'Nessun campo da aggiornare' });
    }
    
    values.push(id);
    
    await pool.query(`
      UPDATE leads
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `, values);
    
    // Recuperiamo i dati aggiornati per restituirli al frontend
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
        notes,
        created_at     AS "createdAt",
        updated_at     AS "updatedAt"
      FROM leads
      WHERE id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lead non trovato dopo l\'aggiornamento' });
    }
    
    // Mappiamo i campi per compatibilità con il frontend
    const mappedLead = {
      ...rows[0],
      email: rows[0].companyEmail || rows[0].privateEmail,
      phone: rows[0].mobilePhone || rows[0].officePhone || rows[0].privatePhone
    };
    
    res.status(200).json(mappedLead);
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
