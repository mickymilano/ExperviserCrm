// Funzioni relative al collegamento tra Contacts e Companies

// Get contacts associated with a company by company_id
export async function getContactsByCompany(companyId: number): Promise<Contact[]> {
  try {
    console.log(
      "PostgresStorage.getContactsByCompany: retrieving contacts for company", companyId
    );
    
    const result = await pool.query(
      `SELECT 
        id, 
        first_name as "firstName", 
        last_name as "lastName",
        CONCAT(first_name, ' ', last_name) as "fullName",
        company_id as "companyId",
        status, 
        company_email as "companyEmail", 
        private_email as "privateEmail", 
        mobile_phone as "mobilePhone", 
        office_phone as "officePhone",
        private_phone as "privatePhone",
        created_at as "createdAt", 
        updated_at as "updatedAt" 
      FROM contacts 
      WHERE company_id = $1
      ORDER BY first_name, last_name`,
      [companyId]
    );
    
    return result.rows as Contact[];
  } catch (error) {
    console.error("Error in getContactsByCompany:", error);
    return [];
  }
}

// Get contacts without assigned company
export async function getUnassignedContacts(): Promise<Contact[]> {
  try {
    console.log(
      "PostgresStorage.getUnassignedContacts: retrieving contacts without company"
    );
    
    const result = await pool.query(
      `SELECT 
        id, 
        first_name as "firstName", 
        last_name as "lastName",
        CONCAT(first_name, ' ', last_name) as "fullName",
        status, 
        company_email as "companyEmail", 
        private_email as "privateEmail", 
        mobile_phone as "mobilePhone", 
        office_phone as "officePhone",
        private_phone as "privatePhone",
        created_at as "createdAt", 
        updated_at as "updatedAt" 
      FROM contacts 
      WHERE company_id IS NULL
      ORDER BY first_name, last_name`
    );
    
    return result.rows as Contact[];
  } catch (error) {
    console.error("Error in getUnassignedContacts:", error);
    return [];
  }
}

// Update contact with company association
export async function updateContactCompany(contactId: number, companyId: number | null): Promise<boolean> {
  try {
    console.log(
      `PostgresStorage.updateContactCompany: updating contact ${contactId} with company ${companyId || 'NULL'}`
    );
    
    const result = await pool.query(
      `UPDATE contacts 
       SET company_id = $1, updated_at = NOW() 
       WHERE id = $2`,
      [companyId, contactId]
    );
    
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error in updateContactCompany:", error);
    return false;
  }
}