import { test, expect } from '@playwright/test';

// Helper function to test navigation for a module
async function testModuleNavigation(page, moduleName) {
  console.log(`Testing ${moduleName} module navigation...`);
  
  // Navigate to the module list page
  await page.goto(`/${moduleName}`);
  await page.waitForLoadState('networkidle');
  
  // Check if we can see the list page
  const moduleTitle = await page.getByRole('heading', { name: new RegExp(moduleName, 'i') }).count();
  console.log(`${moduleName} page loaded: ${moduleTitle > 0 ? 'Yes' : 'No'}`);
  
  // Try to find the first item in the list
  const firstItemLink = await page.locator(`a[href^="/${moduleName}/"]`).first();
  const hasItems = await firstItemLink.count() > 0;
  
  if (hasItems) {
    // Get the ID of the first item
    const href = await firstItemLink.getAttribute('href');
    const id = href.split('/').pop();
    
    if (id && !isNaN(Number(id))) {
      console.log(`Found item with ID: ${id}`);
      
      // Click on the first item
      await firstItemLink.click();
      await page.waitForLoadState('networkidle');
      
      // Check if detail page loaded correctly
      const currentUrl = page.url();
      expect(currentUrl).toContain(`/${moduleName}/${id}`);
      console.log(`Detail page loaded: ${currentUrl.includes(`/${moduleName}/${id}`) ? 'Yes' : 'No'}`);
      
      // Try to find edit button if it exists
      const editButton = await page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.count() > 0) {
        console.log('Edit button found');
        // We don't click it to avoid state changes
      } else {
        console.log('Edit button not found');
      }
      
      // Check for delete button
      const deleteButton = await page.getByRole('button', { name: /delete/i }).first();
      if (await deleteButton.count() > 0) {
        console.log('Delete button found');
        // We don't click it to avoid data deletion
      } else {
        console.log('Delete button not found');
      }
      
      // Navigate back to list
      await page.goto(`/${moduleName}`);
    } else {
      console.warn(`WARNING: Item ID is undefined or invalid for ${moduleName}`);
    }
  } else {
    console.log(`No items found in ${moduleName} list`);
  }
}

test.describe('CRM Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page and ensure we're logged in
    await page.goto('/');
    
    // Check if we need to log in (if there's a login form)
    const loginButton = await page.getByRole('button', { name: /login/i }).count();
    if (loginButton > 0) {
      // If we need to implement login logic
      console.log('Need to implement login logic');
    }
  });
  
  // Test for contacts module
  test('Contacts module navigation', async ({ page }) => {
    await testModuleNavigation(page, 'contacts');
  });
  
  // Test for companies module
  test('Companies module navigation', async ({ page }) => {
    await testModuleNavigation(page, 'companies');
  });
  
  // Test for deals module
  test('Deals module navigation', async ({ page }) => {
    await testModuleNavigation(page, 'deals');
  });
  
  // Test for leads module
  test('Leads module navigation', async ({ page }) => {
    await testModuleNavigation(page, 'leads');
  });
  
  // Test for synergies module
  test('Synergies module navigation', async ({ page }) => {
    await testModuleNavigation(page, 'synergies');
  });
  
  // Test for calendar module
  test('Calendar module navigation', async ({ page }) => {
    await testModuleNavigation(page, 'calendar');
  });
  
  // Test for email module
  test('Email module navigation', async ({ page }) => {
    await testModuleNavigation(page, 'email');
  });
});