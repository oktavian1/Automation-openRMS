import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { PatientSearchPage } from '../pages/PatientSearchPage';
import { RegistrationPage } from '../pages/RegistrationPage';
import { PatientDetailPage } from '../pages/PatientDetailPage';
import { generatePatientData } from '../utils/data-generator';
import type { PatientData } from '../pages/RegistrationPage';

// Extend basic test by adding custom fixtures
type TestFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  patientSearchPage: PatientSearchPage;
  registrationPage: RegistrationPage;
  patientDetailPage: PatientDetailPage;
  loggedInUser: void;
  adminUser: { username: string; password: string; location: string };
  testPatient: PatientData;
};

export const test = base.extend<TestFixtures>({
  /**
   * Admin user credentials fixture
   */
  adminUser: async ({}, use) => {
    const adminCredentials = {
      username: process.env.ADMIN_USER || 'admin',
      password: process.env.ADMIN_PASS || 'Admin123',
      location: process.env.DEFAULT_LOCATION || 'random', // Support random selection
    };
    await use(adminCredentials);
  },

  /**
   * Login page fixture
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * Home page fixture
   */
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  /**
   * Patient search page fixture
   */
  patientSearchPage: async ({ page }, use) => {
    const patientSearchPage = new PatientSearchPage(page);
    await use(patientSearchPage);
  },

  /**
   * Registration page fixture
   */
  registrationPage: async ({ page }, use) => {
    const registrationPage = new RegistrationPage(page);
    await use(registrationPage);
  },

  /**
   * Patient detail page fixture
   */
  patientDetailPage: async ({ page }, use) => {
    const patientDetailPage = new PatientDetailPage(page);
    await use(patientDetailPage);
  },

  /**
   * Pre-authenticated user session fixture
   * This automatically logs in a user before each test
   */
  loggedInUser: async ({ page, loginPage, adminUser }) => {
    try {
      // Set a longer timeout for login operations
      page.setDefaultTimeout(45000);

      // Navigate to login page and login
      await loginPage.goto();
      await loginPage.login(adminUser.username, adminUser.password, adminUser.location);

      // Wait for successful login by checking if we're on home page
      const homePage = new HomePage(page);
      await homePage.waitForPageLoad();
      // Reset timeout to normal
      page.setDefaultTimeout(30000);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Test patient data fixture
   * Generates fresh patient data for each test
   */
  testPatient: async ({}, use) => {
    const patientData = generatePatientData();
    await use(patientData);
  },
});

/**
 * Custom expect extensions for OpenMRS specific assertions
 */
export { expect } from '@playwright/test';

/**
 * Test configuration helpers
 */
export const testConfig = {
  /**
   * Tags for test categorization
   */
  tags: {
    SMOKE: '@smoke',
    REGRESSION: '@regression',
    CRITICAL: '@critical',
    WIP: '@wip',
    API: '@api',
    UI: '@ui',
  },

  /**
   * Test timeouts
   */
  timeouts: {
    SHORT: 5 * 1000,
    MEDIUM: 15 * 1000,
    LONG: 30 * 1000,
    EXTENDED: 60 * 1000,
  },

  /**
   * Test data constants
   */
  testData: {
    VALID_LOCATIONS: [
      'Inpatient Ward',
      'Outpatient Clinic',
      'Laboratory',
      'Pharmacy',
      'Registration Desk',
      'Isolation Ward',
    ],
    INVALID_CREDENTIALS: [
      { username: 'invalid', password: 'invalid', location: 'random' },
      { username: '', password: '', location: 'random' },
      { username: 'admin', password: 'wrong', location: 'random' },
    ],
  },
};

/**
 * Test utilities
 */
export const testUtils = {
  /**
   * Wait for element with custom timeout
   */
  async waitForElement(locator: any, timeout: number = testConfig.timeouts.MEDIUM) {
    await locator.waitFor({ timeout });
  },

  /**
   * Take screenshot with custom name
   */
  async takeScreenshot(page: any, name: string) {
    await page.screenshot({
      path: `automation/reports/test-artifacts/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  },

  /**
   * Generate unique test identifier
   */
  generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Format date for form input
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  },

  /**
   * Sleep utility (use sparingly, prefer waitFor methods)
   */
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};
