import { pool } from '../db.js';

export const listLeads = async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        first_name  AS "firstName",
        last_name   AS "lastName",
        company_name AS company,
        email,
        phone,
        status
      FROM leads
      ORDER BY id DESC
    `);
    res.json(rows);
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
        first_name  AS "firstName",
        last_name   AS "lastName",
        company_name AS company,
        email,
        phone,
        status
      FROM leads
      WHERE id = $1
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Lead non trovato' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ message: 'Errore durante il recupero del lead' });
  }
};

export const createLead = async (req, res, next) => {
  try {
    const { firstName, lastName, company, email, phone, status } = req.body;
    
    const { rows } = await pool.query(`
      INSERT INTO leads
        (first_name, last_name, company_name, email, phone, status)
      VALUES($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        first_name   AS "firstName",
        last_name    AS "lastName",
        company_name AS company,
        email,
        phone,
        status
    `, [firstName, lastName, company, email, phone, status || 'new']);
    
    res.status(201).json(rows[0]);
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
    
    if (updates.email !== undefined) {
      fields.push(`email=$${paramIndex++}`);
      values.push(updates.email);
    }
    
    if (updates.phone !== undefined) {
      fields.push(`phone=$${paramIndex++}`);
      values.push(updates.phone);
    }
    
    if (updates.status !== undefined) {
      fields.push(`status=$${paramIndex++}`);
      values.push(updates.status);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ message: 'Nessun campo da aggiornare' });
    }
    
    values.push(id);
    
    await pool.query(`
      UPDATE leads
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `, values);
    
    res.sendStatus(204);
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
        first_name AS "firstName",
        last_name AS "lastName",
        company_name AS company,
        email,
        phone,
        status
      FROM leads
      WHERE id = $1
    `, [id]);
    
    if (leadRows.length === 0) {
      return res.status(404).json({ message: 'Lead non trovato' });
    }
    
    const lead = leadRows[0];
    
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
      INSERT INTO contacts (first_name, last_name, email, phone, company_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [lead.firstName, lead.lastName, lead.email, lead.phone, companyId]);
    
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