import { Page, Locator, expect } from '@playwright/test';

export class PatientSearchPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchResults: Locator;
  readonly patientRows: Locator;
  readonly noResultsMessage: Locator;
  readonly loadingIndicator: Locator;
  readonly pageTitle: Locator;
  readonly clearSearchButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Search elements - Updated for OpenMRS UI
    this.searchInput = page.locator(
      '#patient-search, input[type="text"], .form-control, input.form-control, input[placeholder*="search"], input[placeholder*="patient"]'
    );
    this.clearSearchButton = page.locator('button:has-text("Clear"), .clear-button');

    // Results elements
    this.searchResults = page.locator(
      '.dataTables_wrapper, #patient-search-results-table_wrapper, .patient-search-results'
    );
    this.patientRows = page.locator(
      '#patient-search-results-table tbody tr, tbody tr:not(.dataTables_empty), .patient-row, .result-row'
    );
    this.noResultsMessage = page.locator('.dataTables_empty, td.dataTables_empty');
    this.loadingIndicator = page.locator('.loading, .spinner, .progress, .dataTables_processing');

    // Page elements
    this.pageTitle = page.locator('h2');
  }

  /**
   * Wait for patient search page to load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.searchInput).toBeVisible();
  }

  async searchPatient(query: string) {
    console.log(`Searching for patient: ${query}`);

    // Clear dulu
    await this.searchInput.fill('');
    await this.page.waitForTimeout(300);

    const oldRowTexts = await this.page
      .locator('table tbody tr:not(.dataTables_empty)')
      .allTextContents();

    // Isi query + enter biar trigger search
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');

    // Tunggu sampai row baru muncul
    await this.page
      .waitForFunction(
        (selector, previousTexts, query) => {
          const currentRows = Array.from(document.querySelectorAll(selector));
          const currentTexts = currentRows.map(r => r.textContent?.trim() || '');
          return (
            currentTexts.length > 0 &&
            currentTexts.some(
              t => !previousTexts.includes(t) && t.toLowerCase().includes(query.toLowerCase())
            )
          );
        },
        'table tbody tr:not(.dataTables_empty)',
        oldRowTexts,
        query,
        { timeout: 10000 }
      )
      .catch(() => {
        console.log('No new matching rows detected within timeout');
      });

    // Retry ambil data sampai dapet
    let patients: any[] = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      patients = await this.extractPatients(query);
      if (patients.length > 0) break;
      console.log(`Retry ${attempt + 1}: still empty, waiting...`);
      await this.page.waitForTimeout(2000);
    }

    console.log(`Search completed. Found ${patients.length} matching patients`);

    return {
      success: true,
      hasResults: patients.length > 0,
      resultCount: patients.length,
      patients,
      message:
        patients.length > 0
          ? `Found ${patients.length} patients matching "${query}"`
          : `No patients found matching "${query}"`,
    };
  }

  private async extractPatients(query: string) {
    const allRows = this.page.locator('table tbody tr:not(.dataTables_empty)');
    const count = await allRows.count();

    const patients = [];
    for (let i = 0; i < count; i++) {
      const row = allRows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();

      if (cellCount >= 2) {
        const name = (await cells.nth(1).textContent())?.trim() || '';
        const id = (await cells.nth(0).textContent())?.trim() || '';
        const gender = cellCount > 2 ? (await cells.nth(2).textContent())?.trim() || '' : '';
        const age = cellCount > 3 ? (await cells.nth(3).textContent())?.trim() || '' : '';

        if (name && name.toLowerCase().includes(query.toLowerCase())) {
          patients.push({ index: i, name, id, gender, age });
        }
      }
    }
    return patients;
  }

  /**
   * Private method to check if any search results exist
   */
  private async _hasAnySearchResults(): Promise<boolean> {
    const rows = this.page.locator('tbody tr:not(.dataTables_empty)');
    return (await rows.count()) > 0;
  }

  /**
   * Clear search input
   */
  async clearSearch(): Promise<void> {
    if (await this.clearSearchButton.isVisible()) {
      await this.clearSearchButton.click();
    } else {
      await this.searchInput.clear();
    }
  }

  /**
   * Get search results count
   */
  async getResultsCount(): Promise<number> {
    try {
      await this.patientRows.first().waitFor({ timeout: 5000 });
      return await this.patientRows.count();
    } catch {
      return 0;
    }
  }

  /**
   * Check if search returned results
   */
  async hasResults(): Promise<boolean> {
    try {
      // Use the same logic as our internal _hasAnySearchResults
      const hasResults = await this._hasAnySearchResults();

      if (!hasResults) {
        return false;
      }

      // Check for actual patient rows
      const rowSelectors = ['tbody tr:not(.dataTables_empty)', '.patient-row', '.result-row'];

      for (const selector of rowSelectors) {
        const rows = this.page.locator(selector);
        const count = await rows.count();
        if (count > 0) {
          // Verify it's not an empty state row
          const firstRowText = (await rows.first().textContent()) || '';
          if (
            !firstRowText.toLowerCase().includes('no') &&
            !firstRowText.toLowerCase().includes('empty') &&
            firstRowText.trim() !== ''
          ) {
            return true;
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if no results message is shown
   */
  async hasNoResultsMessage(): Promise<boolean> {
    try {
      await this.noResultsMessage.waitFor({ timeout: 5000 });
      return await this.noResultsMessage.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get patient information from search results
   */
  async getPatientInfo(index: number = 0): Promise<{
    name?: string;
    id?: string;
    age?: string;
    gender?: string;
  }> {
    const row = this.patientRows.nth(index);
    await row.waitFor({ timeout: 5000 });

    const info: any = {};

    // Try to extract patient information (adjust selectors based on actual page structure)
    try {
      info.name = await row.locator('.patient-name, .name, td:nth-child(1)').textContent();
    } catch {}

    try {
      info.id = await row.locator('.patient-id, .id, td:nth-child(2)').textContent();
    } catch {}

    try {
      info.age = await row.locator('.patient-age, .age, td:nth-child(3)').textContent();
    } catch {}

    try {
      info.gender = await row.locator('.patient-gender, .gender, td:nth-child(4)').textContent();
    } catch {}

    return info;
  }

  /**
   * Click on a patient from search results
   */
  async selectPatient(index: number = 0): Promise<void> {
    const row = this.patientRows.nth(index);
    await row.click();
  }

  /**
   * Search and select first patient - updated to work with new return format
   */
  async searchAndSelectPatient(query: string): Promise<{
    success: boolean;
    selectedPatient?: any;
    message?: string;
  }> {
    const searchResult = await this.searchPatient(query);

    if (searchResult.hasResults && searchResult.patients.length > 0) {
      await this.selectPatient(0);
      return {
        success: true,
        selectedPatient: searchResult.patients[0],
        message: `Selected patient: ${searchResult.patients[0].name || 'Unknown'}`,
      };
    } else {
      return {
        success: false,
        message: `No patients found for query: ${query}`,
      };
    }
  }

  /**
   * Select patient by index from search results
   */
  async selectPatientFromResults(
    searchResults: any,
    index: number = 0
  ): Promise<{
    success: boolean;
    selectedPatient?: any;
    message?: string;
  }> {
    if (!searchResults.hasResults || !searchResults.patients[index]) {
      return {
        success: false,
        message: `Patient at index ${index} not found`,
      };
    }

    try {
      await this.selectPatient(index);
      return {
        success: true,
        selectedPatient: searchResults.patients[index],
        message: `Selected patient: ${searchResults.patients[index].name || 'Unknown'}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error selecting patient: ${error}`,
      };
    }
  }

  /**
   * Get all patient names from search results
   */
  async getAllPatientNames(): Promise<string[]> {
    if (!(await this.hasResults())) {
      return [];
    }

    const nameElements = this.patientRows.locator('.patient-name, .name, td:nth-child(1)');
    return await nameElements.allTextContents();
  }

  /**
   * Check if search is loading
   */
  async isLoading(): Promise<boolean> {
    try {
      return await this.loadingIndicator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Wait for search to complete
   */
  async waitForSearchComplete(): Promise<void> {
    // Wait for loading to disappear
    try {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 3000 });
    } catch {
      // Loading indicator might not be present
    }

    // Wait a bit for search results to appear or stabilize
    await this.page.waitForTimeout(2000);

    // Check if we have any search results
    const hasResults = await this._hasAnySearchResults();
    console.log('Search completion check:', { hasResults });
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string | null> {
    try {
      return await this.pageTitle.textContent();
    } catch {
      return null;
    }
  }
}
