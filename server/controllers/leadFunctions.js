import { pool } from '../db';
export const getLeads = async () => {
  const { rows } = await pool.query(
    `SELECT
       id,
       first_name  AS "firstName",
       last_name   AS "lastName",
       company_name AS company,
       email,
       phone,
       status
     FROM leads
     ORDER BY id DESC`
  );
  return rows;
};
export const getLead = async (id) => {
  const { rows } = await pool.query(
    `SELECT
       id,
       first_name  AS "firstName",
       last_name   AS "lastName",
       company_name AS company,
       email,
       phone,
       status
     FROM leads
     WHERE id = $1`,
    [id]
  );
  return rows[0];
};
export const createLead = async ({ firstName, lastName, company, email, phone, status }) => {
  const { rows } = await pool.query(
    `INSERT INTO leads
       (first_name, last_name, company_name, email, phone, status)
     VALUES($1,$2,$3,$4,$5,$6)
     RETURNING
       id,
       first_name   AS "firstName",
       last_name    AS "lastName",
       company_name AS company,
       email,
       phone,
       status`,
    [firstName, lastName, company, email, phone, status]
  );
  return rows[0];
};
export const updateLead = async (id, updates) => {
  const fields = [];
  const vals   = [];
  let paramCounter = 1;
  if (updates.firstName) fields.push(`first_name=$${vals.push(updates.firstName)}`);
  if (updates.lastName)  fields.push(`last_name=$${vals.push(updates.lastName)}`);
  if (updates.company)   fields.push(`company_name=$${vals.push(updates.company)}`);
  if (updates.email)     fields.push(`email=$${vals.push(updates.email)}`);
  if (updates.phone)     fields.push(`phone=$${vals.push(updates.phone)}`);
  if (updates.status)    fields.push(`status=$${vals.push(updates.status)}`);
  if (!fields.length) return;
  vals.push(id);
  await pool.query(
    `UPDATE leads
       SET ${fields.join(', ')}
     WHERE id = $${vals.length}`,
    vals
  );
};
export const deleteLead = async (id) => {
  await pool.query(`DELETE FROM leads WHERE id=$1`, [id]);
};
export const convertLead = async (id) => {
  const lead = await getLead(id);
  let companyId = null;
  if (lead.company) {
    const comp = await pool.query(
      `INSERT INTO companies(name) VALUES($1) RETURNING id`,
      [lead.company]
    );
    companyId = comp.rows[0].id;
  }
  const contactRes = await pool.query(
    `INSERT INTO contacts
       (first_name,last_name,email,phone,company_id)
     VALUES($1,$2,$3,$4,$5)
     RETURNING *`,
    [lead.firstName, lead.lastName, lead.email, lead.phone, companyId]
  );
  await updateLead(id, { status: 'converted' });
  return { companyId, contact: contactRes.rows[0] };
};
