/**
 * Utility per il mapping tra camelCase e snake_case
 * 
 * Questo file contiene le funzioni e le mappature per la conversione
 * tra i formati camelCase (usati nel frontend) e snake_case (usati nel database)
 */

/**
 * Mappa di conversione camelCase -> snake_case per i campi aziende
 */
export const companyFieldsMap = {
  // Frontend (camelCase) -> Database (snake_case)
  fullAddress: 'full_address',
  employeeCount: 'employee_count',
  annualRevenue: 'annual_revenue',
  foundedYear: 'founded_year',
  customFields: 'custom_fields',
  parentCompanyId: 'parent_company_id',
  linkedinUrl: 'linkedin_url',
  locationTypes: 'location_types',
  lastContactedAt: 'last_contacted_at',
  nextFollowUpAt: 'next_follow_up_at',
  isActiveRep: 'is_active_rep',
  companyType: 'company_type',
  productsOrServicesTags: 'products_or_services_tags',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

/**
 * Mappa di conversione snake_case -> camelCase per i campi aziende
 */
export const companyFieldsMapReverse = Object.entries(companyFieldsMap).reduce(
  (acc, [camel, snake]) => {
    acc[snake] = camel;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Converte un oggetto da camelCase a snake_case
 * @param obj L'oggetto in camelCase
 * @returns L'oggetto convertito in snake_case
 */
export function toSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Usa la mappa di conversione se disponibile
    const snakeKey = companyFieldsMap[key as keyof typeof companyFieldsMap] || key;
    result[snakeKey] = value;
  }
  
  return result;
}

/**
 * Converte un oggetto da snake_case a camelCase
 * @param obj L'oggetto in snake_case
 * @returns L'oggetto convertito in camelCase
 */
export function toCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Usa la mappa di conversione inversa se disponibile
    const camelKey = companyFieldsMapReverse[key] || key;
    result[camelKey] = value;
  }
  
  return result;
}