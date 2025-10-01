import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameField: Locator;
  readonly passwordField: Locator;
  readonly locationDropdown: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly pageTitle: Locator;
  readonly locationOptions: Locator;
  readonly locationButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Selectors menggunakan kombinasi data attributes, name, dan fallback
    this.usernameField = page.locator('input[name="username"], #username');
    this.passwordField = page.locator('input[name="password"], #password');
    this.locationDropdown = page.locator('select[name="sessionLocation"], #sessionLocation, ul#sessionLocation');
    this.loginButton = page.locator('button:has-text("Login"), input[type="submit"][value*="Login"], #loginButton');
    this.errorMessage = page.locator('.error, .alert-danger, [role="alert"]');
    this.pageTitle = page.locator('h1, .page-title, title');
    this.locationOptions = page.locator('select[name="sessionLocation"] option, #sessionLocation option');
    this.locationButtons = page.locator('ul#sessionLocation li, ul.select li, .location-option, button[data-location]');
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/openmrs/login.htm');
    await this.waitForPageLoad();
  }

  /**
   * Wait for login page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await expect(this.usernameField).toBeVisible();
    await expect(this.passwordField).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Fill username field
   */
  async fillUsername(username: string): Promise<void> {
    await this.usernameField.fill(username);
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordField.fill(password);
  }

  /**
   * Select location (supports both dropdown and button-based selection)
   */
  async selectLocation(location: string | 'random' = 'random'): Promise<void> {
    // Check if it's a real dropdown (select element)
    const isRealDropdown = await this.locationDropdown.evaluate((el) => el.tagName === 'SELECT');
    
    if (isRealDropdown) {
      if (location === 'random') {
        const options = await this.getLocationOptionsFromDropdown();
        const randomLocation = options[Math.floor(Math.random() * options.length)];
        await this.locationDropdown.selectOption({ label: randomLocation });
      } else {
        await this.locationDropdown.selectOption({ label: location });
      }
    } else {
      // Handle button-based location selection (OpenMRS style with UL/LI)
      if (location === 'random') {
        const availableLocations = await this.getLocationOptionsFromButtons();
        const randomLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
        await this.selectLocationButton(randomLocation);
      } else {
        await this.selectLocationButton(location);
      }
    }
  }

  /**
   * Click login button
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Complete login process with credentials
   */
  async login(username: string, password: string, location: string | 'random' = 'random'): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.selectLocation(location);
    await this.clickLogin();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorMessage.waitFor({ timeout: 5000 });
      return await this.errorMessage.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if error message is visible
   */
  async isErrorVisible(): Promise<boolean> {
    try {
      console.log('Checking for error message visibility...', await this.errorMessage.textContent());
      await this.errorMessage.waitFor({ timeout: 2000 });
      return await this.errorMessage.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get available location options (works with both dropdowns and buttons)
   */
  async getLocationOptions(): Promise<string[]> {
    // Check if it's a real dropdown (select element)
    try {
      const isRealDropdown = await this.locationDropdown.evaluate((el) => el.tagName === 'SELECT');
      if (isRealDropdown) {
        return await this.getLocationOptionsFromDropdown();
      } else {
        // Handle button-based locations (UL/LI structure)
        return await this.getLocationOptionsFromButtons();
      }
    } catch {
      // Fallback to button-based if locationDropdown not found
      return await this.getLocationOptionsFromButtons();
    }
  }

  /**
   * Get location options from dropdown
   */
  private async getLocationOptionsFromDropdown(): Promise<string[]> {
    await this.locationOptions.first().waitFor();
    const options = await this.locationOptions.allTextContents();
    return options.filter(option => option.trim() !== '');
  }

  /**
   * Get location options from buttons (OpenMRS style)
   */
  private async getLocationOptionsFromButtons(): Promise<string[]> {
    try {
      // Wait for location buttons to appear
      await this.locationButtons.first().waitFor({ timeout: 5000 });
      const buttons = await this.locationButtons.allTextContents();
      return buttons.filter(option => option.trim() !== '');
    } catch {
      // Fallback: try to find common OpenMRS location patterns
      const commonLocations = [
        'Inpatient Ward',
        'Outpatient Clinic', 
        'Laboratory',
        'Pharmacy',
        'Registration Desk',
        'Isolation Ward'
      ];
      
      // Check which locations are actually available on the page
      const availableLocations = [];
      for (const loc of commonLocations) {
        const locButton = this.page.locator(`text="${loc}"`);
        if (await locButton.isVisible()) {
          availableLocations.push(loc);
        }
      }
      
      return availableLocations.length > 0 ? availableLocations : commonLocations;
    }
  }

  /**
   * Select location by clicking button
   */
  private async selectLocationButton(location: string): Promise<void> {
    // Try different selector patterns for location buttons
    const locationButton = this.page.locator(`text="${location}"`)
      .or(this.page.locator(`[data-location="${location}"]`))
      .or(this.page.locator(`button:has-text("${location}")`))
      .or(this.page.locator(`li:has-text("${location}")`))
      .first();
    
    await locationButton.waitFor({ timeout: 10000 });
    await locationButton.click();
  }

  /**
   * Check if login page is displayed
   */
  async isLoginPageDisplayed(): Promise<boolean> {
    try {
      await this.usernameField.waitFor({ timeout: 5000 });
      await this.passwordField.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.usernameField.clear();
    await this.passwordField.clear();
    // Reset location dropdown to first option if available
    const firstOption = this.locationOptions.first();
    if (await firstOption.isVisible()) {
      const firstValue = await firstOption.getAttribute('value') || '';
      await this.locationDropdown.selectOption(firstValue);
    }
  }
}