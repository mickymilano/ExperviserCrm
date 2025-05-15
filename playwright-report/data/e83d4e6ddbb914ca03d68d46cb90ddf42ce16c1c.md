# Test info

- Name: CRM Navigation Tests >> Email module navigation
- Location: /home/runner/workspace/tests/e2e/navigation.test.ts:108:3

# Error details

```
Error: browserType.launch: Executable doesn't exist at /home/runner/workspace/.cache/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   8 |   await page.goto(`/${moduleName}`);
   9 |   await page.waitForLoadState('networkidle');
   10 |   
   11 |   // Check if we can see the list page
   12 |   const moduleTitle = await page.getByRole('heading', { name: new RegExp(moduleName, 'i') }).count();
   13 |   console.log(`${moduleName} page loaded: ${moduleTitle > 0 ? 'Yes' : 'No'}`);
   14 |   
   15 |   // Try to find the first item in the list
   16 |   const firstItemLink = await page.locator(`a[href^="/${moduleName}/"]`).first();
   17 |   const hasItems = await firstItemLink.count() > 0;
   18 |   
   19 |   if (hasItems) {
   20 |     // Get the ID of the first item
   21 |     const href = await firstItemLink.getAttribute('href');
   22 |     const id = href.split('/').pop();
   23 |     
   24 |     if (id && !isNaN(Number(id))) {
   25 |       console.log(`Found item with ID: ${id}`);
   26 |       
   27 |       // Click on the first item
   28 |       await firstItemLink.click();
   29 |       await page.waitForLoadState('networkidle');
   30 |       
   31 |       // Check if detail page loaded correctly
   32 |       const currentUrl = page.url();
   33 |       expect(currentUrl).toContain(`/${moduleName}/${id}`);
   34 |       console.log(`Detail page loaded: ${currentUrl.includes(`/${moduleName}/${id}`) ? 'Yes' : 'No'}`);
   35 |       
   36 |       // Try to find edit button if it exists
   37 |       const editButton = await page.getByRole('button', { name: /edit/i }).first();
   38 |       if (await editButton.count() > 0) {
   39 |         console.log('Edit button found');
   40 |         // We don't click it to avoid state changes
   41 |       } else {
   42 |         console.log('Edit button not found');
   43 |       }
   44 |       
   45 |       // Check for delete button
   46 |       const deleteButton = await page.getByRole('button', { name: /delete/i }).first();
   47 |       if (await deleteButton.count() > 0) {
   48 |         console.log('Delete button found');
   49 |         // We don't click it to avoid data deletion
   50 |       } else {
   51 |         console.log('Delete button not found');
   52 |       }
   53 |       
   54 |       // Navigate back to list
   55 |       await page.goto(`/${moduleName}`);
   56 |     } else {
   57 |       console.warn(`WARNING: Item ID is undefined or invalid for ${moduleName}`);
   58 |     }
   59 |   } else {
   60 |     console.log(`No items found in ${moduleName} list`);
   61 |   }
   62 | }
   63 |
   64 | test.describe('CRM Navigation Tests', () => {
   65 |   test.beforeEach(async ({ page }) => {
   66 |     // Start from the home page and ensure we're logged in
   67 |     await page.goto('/');
   68 |     
   69 |     // Check if we need to log in (if there's a login form)
   70 |     const loginButton = await page.getByRole('button', { name: /login/i }).count();
   71 |     if (loginButton > 0) {
   72 |       // If we need to implement login logic
   73 |       console.log('Need to implement login logic');
   74 |     }
   75 |   });
   76 |   
   77 |   // Test for contacts module
   78 |   test('Contacts module navigation', async ({ page }) => {
   79 |     await testModuleNavigation(page, 'contacts');
   80 |   });
   81 |   
   82 |   // Test for companies module
   83 |   test('Companies module navigation', async ({ page }) => {
   84 |     await testModuleNavigation(page, 'companies');
   85 |   });
   86 |   
   87 |   // Test for deals module
   88 |   test('Deals module navigation', async ({ page }) => {
   89 |     await testModuleNavigation(page, 'deals');
   90 |   });
   91 |   
   92 |   // Test for leads module
   93 |   test('Leads module navigation', async ({ page }) => {
   94 |     await testModuleNavigation(page, 'leads');
   95 |   });
   96 |   
   97 |   // Test for synergies module
   98 |   test('Synergies module navigation', async ({ page }) => {
   99 |     await testModuleNavigation(page, 'synergies');
  100 |   });
  101 |   
  102 |   // Test for calendar module
  103 |   test('Calendar module navigation', async ({ page }) => {
  104 |     await testModuleNavigation(page, 'calendar');
  105 |   });
  106 |   
  107 |   // Test for email module
> 108 |   test('Email module navigation', async ({ page }) => {
      |   ^ Error: browserType.launch: Executable doesn't exist at /home/runner/workspace/.cache/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell
  109 |     await testModuleNavigation(page, 'email');
  110 |   });
  111 | });
```