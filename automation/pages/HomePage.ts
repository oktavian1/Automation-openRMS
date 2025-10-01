import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly findPatientLink: Locator;
  readonly loginUserInfo: Locator;
  readonly registerPatientLink: Locator;
  readonly registerPatientLinkSimple: Locator;
  readonly activeVisitsLink: Locator;
  readonly userProfileDropdown: Locator;
  readonly logoutLink: Locator;
  readonly welcomeMessage: Locator;
  readonly navigationMenu: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main navigation selectors - berdasarkan struktur OpenMRS yang sebenarnya
    // Use more flexible locators
    this.findPatientLink = page.locator('a:has-text("Find")');
    this.registerPatientLink = page.locator(
      '#referenceapplication-registrationapp-registerPatient-homepageLink-referenceapplication-registrationapp-registerPatient-homepageLink-extension'
    );
    this.registerPatientLinkSimple = page.locator(
      '#registrationapp-basicRegisterPatient-homepageLink-registrationapp-basicRegisterPatient-homepageLink-extension'
    );
    this.activeVisitsLink = page.locator('a:has-text("Active Visits"), text="Active Visits"');

    this.loginUserInfo = page.locator('h4');

    // User profile and logout
    this.userProfileDropdown = page.locator(
      '.user-dropdown, .profile-dropdown, [data-testid="user-menu"]'
    );
    this.logoutLink = page.locator('text="Logout"');

    // Page elements
    this.welcomeMessage = page.locator('.welcome-message, .user-greeting, h1:has-text("Welcome")');
    this.navigationMenu = page.locator('body'); // Use body as navigation menu since links are scattered
    this.pageHeader = page.locator('.page-header, .header, h1');
  }

  /**
   * Navigate to home page
   */
  async goto(): Promise<void> {
    const baseUrl = process.env.BASE_URL || 'http://localhost:8080/openmrs/';
    const homeUrl = baseUrl.endsWith('/') ? `${baseUrl}index.htm` : `${baseUrl}/index.htm`;
    await this.page.goto(homeUrl);
  }

  /**
   * Wait for home page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    console.log('🏠 Starting home page load wait...');

    // First wait for basic page structure with longer timeout
    await this.page.waitForLoadState('domcontentloaded', { timeout: 45000 });
    console.log('📄 DOM content loaded');

    // Then wait for key navigation elements
    await expect(this.findPatientLink).toBeVisible({ timeout: 45000 });
    console.log('🔍 Find Patient link visible');

    await expect(this.registerPatientLink).toBeVisible({ timeout: 45000 });
    console.log('📋 Register Patient link visible');

    // Wait for user info to load
    await this.loginUserInfo.waitFor({ timeout: 10000 });
    console.log('user info: ', await this.loginUserInfo.textContent());

    console.log('✅ Home page fully loaded');
  }

  async simpleRegisterPatientIsVisible(): Promise<boolean> {
    return await this.registerPatientLinkSimple.isVisible();
  }

  async isOnHomePage(): Promise<boolean> {
    try {
      await this.loginUserInfo.waitFor({ timeout: 5000 });

      const url = this.page.url();
      const isPatientUrl = url.includes('/index.htm') || url.includes('/home.page');
      console.log('Current URL:', url, 'isPatientUrl:', isPatientUrl);

      return isPatientUrl && (await this.loginUserInfo.isVisible());
    } catch {
      return false;
    }
  }

  /**
   * Navigate to Find Patient page
   */
  async goToFindPatient(): Promise<void> {
    await this.findPatientLink.click();
  }

  /**
   * Navigate to Register Patient page
   */
  async goToRegisterPatient(): Promise<void> {
    await this.registerPatientLink.click();
  }

  async goToRegisterPatientSimple(): Promise<void> {
    await this.registerPatientLinkSimple.click();
  }

  /**
   * Navigate to Active Visits page
   */
  async goToActiveVisits(): Promise<void> {
    await this.activeVisitsLink.click();
  }

  /**
   * Open user profile dropdown
   */
  async openUserProfileDropdown(): Promise<void> {
    if (await this.userProfileDropdown.isVisible()) {
      await this.userProfileDropdown.click();
    }
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    // Try to find logout link directly, or open dropdown first
    if (await this.logoutLink.isVisible()) {
      await this.logoutLink.click();
    } else {
      await this.openUserProfileDropdown();
      await this.logoutLink.click();
    }
  }

  /**
   * Get welcome message text
   */
  async getWelcomeMessageParts(): Promise<{ userInfo: string; ward: string } | null> {
    try {
      await this.loginUserInfo.waitFor({ timeout: 5000 });
      const text = (await this.loginUserInfo.textContent())?.trim();
      if (!text) return null;
      const regex = /Logged in as .*?\((.*?)\) at (.*)\.?$/;
      const match = text.match(regex);

      if (match) {
        return {
          userInfo: match[1],
          ward: match[2].trim().replace(/\.$/, ''),
        };
      }

      return null;
    } catch (err) {
      console.error('Error parsing welcome message:', err);
      return null;
    }
  }

  /**
   * Check if user is logged in (home page is displayed)
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.findPatientLink.waitFor({ timeout: 10000 });
      return await this.findPatientLink.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get all available navigation links
   */
  async getNavigationLinks(): Promise<string[]> {
    const links = this.navigationMenu.locator('a');
    await links.first().waitFor({ timeout: 5000 });
    return await links.allTextContents();
  }

  /**
   * Click on any navigation link by text
   */
  async clickNavigationLink(linkText: string): Promise<void> {
    const link = this.navigationMenu.locator(`a:has-text("${linkText}")`);
    await link.click();
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check if page contains specific text
   */
  async hasText(text: string): Promise<boolean> {
    const element = this.page.locator(`text=${text}`);
    return await element.isVisible();
  }
}
