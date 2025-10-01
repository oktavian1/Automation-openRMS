import { Page, Locator, expect } from '@playwright/test';

export interface PatientData {
  givenName: string;
  familyName: string;
  gender: 'M' | 'F';
  birthdate: string;
  address1?: string;
  cityVillage?: string;
  country?: string;
  phoneNumber?: string;
  relatives?: RelativeData[];
}

export interface RelativeData {
  relationshipType: string;
  personName: string;
}

export class RegistrationPage {
  readonly page: Page;
  readonly givenNameField: Locator;
  readonly middleNameField: Locator;
  readonly familyNameField: Locator;
  readonly genderSelect: Locator;
  readonly birthdateField: Locator;
  readonly birthdateDay: Locator;
  readonly birthdateMonth: Locator;
  readonly birthdateYear: Locator;
  readonly address1Field: Locator;
  readonly cityVillageField: Locator;
  readonly countryField: Locator;
  readonly phoneNumberField: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;
  readonly nextButton: Locator;
  readonly pageTitle: Locator;
  readonly errorMessages: Locator;
  readonly successMessage: Locator;
  readonly requiredFieldIndicators: Locator;
  // Relatives fields
  readonly relationshipTypeSelect: Locator;
  readonly personNameField: Locator;
  readonly addRelativeButton: Locator;
  readonly removeRelativeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Personal information fields
    this.givenNameField = page.locator('input[name="givenName"]');
    this.middleNameField = page.locator('input[name="middleName"]');
    this.familyNameField = page.locator('input[name="familyName"]');
    this.genderSelect = page.locator('select[name="gender"]');
    this.birthdateField = page.locator('input[name="birthdate"], #birthdate, .birthdate');
    // OpenMRS birthdate components
    this.birthdateDay = page.locator('#birthdateDay-field');
    this.birthdateMonth = page.locator('#birthdateMonth-field');
    this.birthdateYear = page.locator('#birthdateYear-field');

    // Address fields
    this.address1Field = page.locator('input[name="address1"], #address1, .address-line-1');
    this.cityVillageField = page.locator('input[name="cityVillage"], #cityVillage, .city');
    this.countryField = page.locator('input[name="country"], select[name="country"], #country');
    this.phoneNumberField = page.locator('input[name="phoneNumber"], #phoneNumber, .phone');

    // Action buttons
    this.submitButton = page.locator(
      'button:has-text("Submit"), input[type="submit"], .submit-button'
    );
    this.cancelButton = page.locator('button:has-text("Cancel"), .cancel-button');
    this.confirmButton = page.locator('button:has-text("Confirm"), .confirm-button');
    this.nextButton = page.locator('#next-button');

    // Page elements
    this.pageTitle = page.locator('h2');
    this.errorMessages = page.locator('.error, .alert-danger, .field-error');
    this.successMessage = page.locator('.success, .alert-success, .confirmation');
    this.requiredFieldIndicators = page.locator('.required, .mandatory, .asterisk');

    // Relatives fields
    this.relationshipTypeSelect = page.locator('select[id*="relationship"]');
    this.personNameField = page.locator('input[placeholder*="Person Name"]');
    this.addRelativeButton = page.locator('.icon-plus-sign.edit-action');
    this.removeRelativeButton = page.locator('.icon-minus-sign.edit-action');
  }

  /**
   * Wait for registration page to load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.givenNameField).toBeVisible({ timeout: 5000 });
    await expect(this.middleNameField).toBeVisible();
    await expect(this.familyNameField).toBeVisible();
    await expect(this.nextButton).toBeVisible();
  }

  /**
   * Fill patient's given name
   */
  async fillGivenName(givenName: string): Promise<void> {
    await this.givenNameField.fill(givenName);
  }

  /**
   * Fill patient's family name
   */
  async fillFamilyName(familyName: string): Promise<void> {
    await this.familyNameField.fill(familyName);
  }

  /**
   * Select patient's gender
   */
  async selectGender(gender: 'M' | 'F'): Promise<void> {
    await this.genderSelect.waitFor({ timeout: 10000 });

    if (gender === 'M') {
      await this.genderSelect.selectOption('M');
    } else {
      await this.genderSelect.selectOption('F');
    }
  }

  /**
   * Fill patient's birthdate (format: YYYY-MM-DD)
   */
  async fillBirthdate(birthdate: string): Promise<void> {
    // Parse birthdate string (format: YYYY-MM-DD)
    const [year, month, day] = birthdate.split('-');

    // Check if separate birthdate components are available
    const hasSeparateComponents = await this.birthdateDay.isVisible().catch(() => false);

    if (hasSeparateComponents) {
      console.log(`Filling birthdate: Year=${year}, Month=${month}, Day=${day}`);
      await this.birthdateDay.fill(parseInt(day).toString());
      const monthValue = parseInt(month).toString();
      console.log(`Converting month ${month} to ${monthValue}`);
      await this.birthdateMonth.selectOption(monthValue);

      await this.birthdateYear.fill(year);
    } else {
      // Fallback to single birthdate field
      await this.birthdateField.fill(birthdate);
    }
  }

  /**
   * Fill patient's address
   */
  async fillAddress(address: string): Promise<void> {
    await this.address1Field.fill(address);
  }

  /**
   * Fill patient's city/village
   */
  async fillCityVillage(city: string): Promise<void> {
    await this.cityVillageField.fill(city);
  }

  /**
   * Fill patient's country
   */
  async fillCountry(country: string): Promise<void> {
    // Handle both input and select elements
    if ((await this.countryField.getAttribute('tagName')) === 'SELECT') {
      await this.countryField.selectOption({ label: country });
    } else {
      await this.countryField.fill(country);
    }
  }

  /**
   * Fill patient's phone number
   */
  async fillPhoneNumber(phone: string): Promise<void> {
    await this.phoneNumberField.fill(phone);
  }

  /**
   * Add a relative
   */
  async addRelative(relativeData: RelativeData, index: number = 0): Promise<void> {
    // Select relationship type untuk relative index tertentu
    const relationshipSelect = this.page
      .locator('select[name="relationshipType"], select[id*="relationship"]')
      .nth(index);
    await relationshipSelect.waitFor({ timeout: 10000 });
    await relationshipSelect.selectOption(relativeData.relationshipType);

    // Fill person name untuk relative index tertentu
    const personNameInput = this.page
      .locator('input[name="personName"], input[placeholder*="Person Name"]')
      .nth(index);
    await personNameInput.fill(relativeData.personName);

    // Click add button terakhir (untuk menambah relative baru)
    const addButtons = this.page.locator('.icon-plus-sign.edit-action');
    const addButtonCount = await addButtons.count();

    if (addButtonCount > 0) {
      // Click add button terakhir untuk menambah relative baru
      await addButtons.last().click();
      // Wait for new relative form to appear
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Add multiple relatives
   */
  async addRelatives(relatives: RelativeData[]): Promise<void> {
    for (let i = 0; i < relatives.length; i++) {
      await this.addRelative(relatives[i], i);
    }
  }

  /**
   * Get available relationship types
   */
  async getRelationshipTypes(): Promise<string[]> {
    await this.relationshipTypeSelect.waitFor({ timeout: 10000 });
    const options = await this.relationshipTypeSelect.locator('option').allTextContents();
    return options.filter(
      option => option.trim() !== '' && option.trim() !== 'Select Relationship Type'
    );
  }

  /**
   * Register a new patient with all required information
   */
  async registerPatient(patientData: PatientData): Promise<void> {
    await this.fillGivenName(patientData.givenName);
    await this.fillFamilyName(patientData.familyName);
    await this.nextButton.click();
    await this.selectGender(patientData.gender);
    await this.nextButton.click();
    await this.fillBirthdate(patientData.birthdate);
    await this.nextButton.click();
    // Fill optional fields if provided
    if (patientData.address1) {
      await this.fillAddress(patientData.address1);
    }

    if (patientData.cityVillage) {
      await this.fillCityVillage(patientData.cityVillage);
    }

    if (patientData.country) {
      await this.fillCountry(patientData.country);
    }
    await this.nextButton.click();

    if (patientData.phoneNumber) {
      await this.fillPhoneNumber(patientData.phoneNumber);
    }
    await this.nextButton.click();
    // Add relatives if provided
    if (patientData.relatives && patientData.relatives.length > 0) {
      await this.addRelatives(patientData.relatives);
    }
    await this.nextButton.click();

    await this.submit();

    // Handle confirmation step if it exists
    await this.confirm();
  }

  async simpleRegisterPatient(patientData: PatientData): Promise<void> {
    console.log('Registering patient with data:', patientData);
    await this.fillGivenName(patientData.givenName);
    await this.fillFamilyName(patientData.familyName);
    await this.nextButton.click();
    await this.selectGender(patientData.gender);
    await this.nextButton.click();
    await this.fillBirthdate(patientData.birthdate);
    await this.nextButton.click();
    await this.submit();
    await this.confirm();
  }

  /**
   * Submit the registration form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Cancel the registration
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Confirm registration (if confirmation step exists)
   */
  async confirm(): Promise<void> {
    if (await this.confirmButton.isVisible()) {
      await this.confirmButton.click();
    }
  }

  /**
   * Get validation error messages
   */
  async getErrorMessages(): Promise<string[]> {
    try {
      await this.errorMessages.first().waitFor({ timeout: 5000 });
      return await this.errorMessages.allTextContents();
    } catch {
      return [];
    }
  }

  /**
   * Check if form has validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    try {
      await this.errorMessages.first().waitFor({ timeout: 3000 });
      return await this.errorMessages.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string | null> {
    try {
      // Method 1: Check for success message element
      const hasSuccessMessage = await this.successMessage.isVisible().catch(() => false);
      if (hasSuccessMessage) {
        return await this.successMessage.textContent();
      }

      // Method 2: If on patient page, create success message
      const currentUrl = this.page.url();
      const isOnPatientPage =
        currentUrl.includes('/patient.page') || currentUrl.includes('/clinicianfacing/patient');
      console.log('Current URL after registration:', currentUrl);
      console.log('Is on patient page:', isOnPatientPage);

      if (isOnPatientPage) {
        // Get patient name from the page
        const patientNameElement = this.page.locator('h1').first();
        const patientName = await patientNameElement.textContent().catch(() => 'Patient');
        console.log('Patient Name:', patientName);
        return `${patientName} successfully registered`;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if registration was successful
   * This method should be used with PatientDetailPage for better verification
   */
  async isRegistrationSuccessful(): Promise<boolean> {
    try {
      // Method 1: Check for success message
      await this.page.waitForTimeout(3000); // Wait for any redirects
      const hasSuccessMessage = await this.successMessage.isVisible().catch(() => false);

      if (hasSuccessMessage) {
        return true;
      }

      // Method 2: Check if redirected to patient page (indicates success)
      const currentUrl = this.page.url();
      const isOnPatientPage =
        currentUrl.includes('/patient.page') || currentUrl.includes('/clinicianfacing/patient');

      if (isOnPatientPage) {
        // Additional verification: check if patient detail page has loaded properly
        const patientNameVisible = await this.page
          .locator('h1')
          .first()
          .isVisible()
          .catch(() => false);
        const generalActionsVisible = await this.page
          .locator('h3:has-text("General Actions")')
          .isVisible()
          .catch(() => false);
        console.log('Patient Name Visible:', patientNameVisible);
        console.log('General Actions Visible:', generalActionsVisible);
        return patientNameVisible && generalActionsVisible;
      }

      // Method 3: Check if still on registration page (indicates failure/stay)
      const isOnRegistrationPage =
        currentUrl.includes('/registration') || currentUrl.includes('/registerPatient');

      return !isOnRegistrationPage;
    } catch {
      return false;
    }
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.givenNameField.clear();
    await this.familyNameField.clear();
    await this.birthdateField.clear();
    await this.address1Field.clear();
    await this.cityVillageField.clear();
    if ((await this.countryField.getAttribute('tagName')) !== 'SELECT') {
      await this.countryField.clear();
    }
    await this.phoneNumberField.clear();
  }

  /**
   * Get required fields that are missing values
   */
  async getMissingRequiredFields(): Promise<string[]> {
    const missingFields: string[] = [];

    const requiredFields = [
      { field: this.givenNameField, name: 'Given Name' },
      { field: this.familyNameField, name: 'Family Name' },
      { field: this.birthdateField, name: 'Birthdate' },
    ];

    for (const { field, name } of requiredFields) {
      const value = await field.inputValue();
      if (!value || value.trim() === '') {
        missingFields.push(name);
      }
    }

    return missingFields;
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
