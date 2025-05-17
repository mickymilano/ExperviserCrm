/**
 * Utility per il mapping tra camelCase e snake_case
 * 
 * Questo file contiene le funzioni e le mappature per la conversione
 * tra i formati camelCase (usati nel frontend) e snake_case (usati nel database)
 */

/**
 * Mappa di conversione camelCase -> snake_case per i campi aziende
 * Mappa completa che include TUTTI i campi presenti nella tabella companies
 */
export const companyFieldsMap = {
  // Frontend (camelCase) -> Database (snake_case)
  
  // Campi base
  name: 'name',
  status: 'status',
  email: 'email',
  phone: 'phone',
  
  // Campi deprecati ma ancora presenti nel DB
  address: 'address',
  country: 'country',
  
  // Campi correnti
  fullAddress: 'full_address',
  website: 'website',
  industry: 'industry',
  sector: 'sector',
  description: 'description',
  
  // Campi dimensionali
  employeeCount: 'employee_count',
  annualRevenue: 'annual_revenue',
  foundedYear: 'founded_year',
  
  // Media e URL
  logo: 'logo',
  linkedinUrl: 'linkedin_url',
  
  // Relazioni
  parentCompanyId: 'parent_company_id',
  
  // Categorizzazione
  tags: 'tags',
  companyType: 'company_type',
  brands: 'brands',
  channels: 'channels',
  productsOrServicesTags: 'products_or_services_tags',
  locationTypes: 'location_types',
  
  // Stati e configurazioni
  isActiveRep: 'is_active_rep',
  
  // Date
  lastContactedAt: 'last_contacted_at',
  nextFollowUpAt: 'next_follow_up_at',
  
  // Altri campi
  notes: 'notes',
  customFields: 'custom_fields',
  
  // Metadati
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