import { Page, Locator, expect } from '@playwright/test';

export interface PatientInfo {
  givenName: string;
  familyName: string;
  gender: string;
  age: string;
  birthdate: string;
  patientId: string;
}

export interface PatientContact {
  address?: string;
  phoneNumber?: string;
}

export interface PatientRelativeInfo {
  name: string;
  relationship: string;
}

export interface PatientDiagnosis {
  condition: string;
  status: string;
  date?: string;
}

export interface PatientVisit {
  date: string;
  visitType?: string;
  location?: string;
  provider?: string;
}

export interface PatientObservation {
  name: string;
  value: string;
  unit?: string;
  date?: string;
}

export interface PatientVitals {
  bloodPressure?: string;
  temperature?: string;
  heartRate?: string;
  weight?: string;
  height?: string;
  bmi?: string;
}

export class PatientDetailPage {
  readonly page: Page;

  // Patient information elements
  readonly patientGivenName: Locator;
  readonly patientFamilyName: Locator;
  readonly patientGender: Locator;
  readonly patientAge: Locator;
  readonly patientId: Locator;
  readonly patientBirthdate: Locator;

  // Contact information
  readonly contactInfoSection: Locator;
  readonly patientAddress: Locator;
  readonly patientPhone: Locator;
  readonly showContactInfoButton: Locator;

  // Family/Relatives section
  readonly familySection: Locator;
  readonly familyList: Locator;
  readonly relativesItems: Locator;

  // General sections
  readonly diagnosesSection: Locator;
  readonly observationsSection: Locator;
  readonly visitsSection: Locator;
  readonly conditionsSection: Locator;
  readonly allergiesSection: Locator;
  readonly attachmentsSection: Locator;

  // Data content areas
  readonly diagnosesContent: Locator;
  readonly observationsContent: Locator;
  readonly visitsContent: Locator;
  readonly vitalsContent: Locator;

  // Action buttons
  readonly generalActionsSection: Locator;
  readonly startVisitButton: Locator;
  readonly editRegistrationButton: Locator;
  readonly deletePatientButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Patient basic information
    this.patientGivenName = page.locator('.PersonName-givenName');
    this.patientFamilyName = page.locator('.PersonName-familyName');
    this.patientGender = page.locator(
      '[class*="gender"], .demographics .gender, .patient-header .gender'
    );
    this.patientAge = page.locator('[class*="age"], .demographics .age, .patient-header .age');
    this.patientId = page.locator('[class*="patient-id"], .patient-header .id, .demographics .id');
    this.patientBirthdate = page.locator(
      '[class*="birthdate"], .demographics .birthdate, .patient-header .birthdate'
    );

    // Contact information
    this.contactInfoSection = page.locator('[class*="contact"], .contact-info');
    this.showContactInfoButton = page.locator('text="Show Contact Info"');
    this.patientAddress = page.locator('.address, [class*="address"]');
    this.patientPhone = page.locator('.phone, [class*="phone"]');

    // Family section
    this.familySection = page.locator('h3:has-text("FAMILY")').locator('..');
    this.familyList = page.locator('h3:has-text("FAMILY") + *, h3:has-text("FAMILY") ~ *');
    this.relativesItems = page.locator('.relative, .family-member, [class*="relative"]');

    // Other sections
    this.diagnosesSection = page.locator('h3:has-text("DIAGNOSES")');
    this.observationsSection = page.locator('h3:has-text("LATEST OBSERVATIONS")');
    this.visitsSection = page.locator('h3:has-text("RECENT VISITS")');
    this.conditionsSection = page.locator('h3:has-text("CONDITIONS")');
    this.allergiesSection = page.locator('h3:has-text("ALLERGIES")');
    this.attachmentsSection = page.locator('h3:has-text("ATTACHMENTS")');

    // Data content areas
    this.diagnosesContent = page.locator(
      'h3:has-text("DIAGNOSES") ~ *, h3:has-text("DIAGNOSES") + *'
    );
    this.observationsContent = page.locator(
      'h3:has-text("LATEST OBSERVATIONS") ~ *, h3:has-text("LATEST OBSERVATIONS") + *'
    );
    this.visitsContent = page.locator(
      'h3:has-text("RECENT VISITS") ~ *, h3:has-text("RECENT VISITS") + *'
    );
    this.vitalsContent = page
      .locator('h3:has-text("VITALS"), h3:has-text("VITAL SIGNS")')
      .locator('~ *, + *');

    // Action buttons
    this.generalActionsSection = page.locator('h3:has-text("General Actions")');
    this.startVisitButton = page.locator('text="Start Visit"');
    this.editRegistrationButton = page.locator('text="Edit Registration Information"');
    this.deletePatientButton = page.locator('text="Delete Patient"');
  }

  /**
   * Wait for patient detail page to load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    await expect(this.patientGivenName).toBeVisible({ timeout: 20000 });
  }

  /**
   * Check if we are on a patient detail page
   */
  async isOnPatientDetailPage(): Promise<boolean> {
    try {
      await this.patientGivenName.waitFor({ timeout: 5000 });
      const url = this.page.url();
      const isHomeUrl = url.includes('/patient.page') || url.includes('/clinicianfacing/patient');
      console.log('Current URL:', url, 'isHomeUrl:', isHomeUrl);

      return isHomeUrl && (await this.patientGivenName.isVisible());
    } catch {
      return false;
    }
  }

  /**
   * Get patient's given name
   */
  async getPatientGivenName(): Promise<string> {
    try {
      const givenNameText = await this.patientGivenName.textContent();
      return givenNameText?.trim() || '';
    } catch {
      return '';
    }
  }

  /**
   * Get patient's family name
   */
  async getPatientFamilyName(): Promise<string> {
    try {
      const familyNameText = await this.patientFamilyName.textContent();
      return familyNameText?.trim() || '';
    } catch {
      // Fallback: extract from full name

      return '';
    }
  }

  /**
   * Get patient's gender
   */
  async getPatientGender(): Promise<string> {
    try {
      const demographicsSection = this.page.locator('.demographics');
      const genderText = await demographicsSection
        .locator('text=/Male|Female/')
        .first()
        .textContent();
      return genderText?.trim() || '';
    } catch {
      try {
        const genderElement = this.page.locator('text=/Male|Female/').first();
        const genderText = await genderElement.textContent();
        return genderText?.trim() || '';
      } catch {
        return '';
      }
    }
  }

  /**
   * Get patient's age information
   */
  async getPatientAge(): Promise<string> {
    try {
      // Look for age pattern like "63 year(s)"
      const ageElement = this.page.locator('text=/\\d+ year\\(s\\)/').first();
      const ageText = await ageElement.textContent();

      if (ageText) {
        console.log('Found age text:', JSON.stringify(ageText));

        // Clean up the text - normalize whitespace
        const cleanedText = ageText
          .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
          .trim(); // Remove leading/trailing whitespace

        console.log('Cleaned age text:', cleanedText);
        return cleanedText;
      }

      return '';
    } catch (error) {
      console.log('Error getting age:', error);
      return '';
    }
  }

  /**
   * Get patient's birthdate
   */
  async getPatientBirthdate(): Promise<string> {
    try {
      // Coba ambil dari age section, contoh: "49 year(s) ( 22.Mar.1976)"
      const ageText = await this.getPatientAge();
      if (ageText) {
        // Regex cari tanggal di dalam kurung -> "22.Mar.1976"
        const birthdateMatch = ageText.match(/\(\s*(\d{1,2}\.\w{3}\.\d{4})\s*\)/);
        if (birthdateMatch) {
          const birthdateText = birthdateMatch[1]
            .replace(/\s+/g, ' ') // normalisasi spasi
            .trim();
          console.log('Extracted birthdate from age text:', birthdateText);
          return birthdateText;
        }
      }

      // Fallback: coba beberapa selector yang mungkin ada di halaman
      const selectors = [
        'text=/\\d{1,2}\\.\\w{3}\\.\\d{4}/', // pattern langsung tanggal
        '[class*="birthdate"]',
        '[data-testid*="birthdate"]',
      ];

      for (const selector of selectors) {
        try {
          const birthdateElement = this.page.locator(selector).first();
          const birthdateText = await birthdateElement.textContent({ timeout: 2000 });

          if (birthdateText && birthdateText.trim()) {
            console.log(
              `Found birthdate with selector "${selector}":`,
              JSON.stringify(birthdateText)
            );

            const cleanedText = birthdateText
              .replace(/[()]/g, '') // hapus tanda kurung
              .replace(/\s+/g, ' ') // normalisasi spasi
              .trim();

            console.log('Cleaned birthdate text:', cleanedText);
            return cleanedText;
          }
        } catch {
          // lanjut ke selector berikutnya
        }
      }

      console.log('No birthdate found, returning empty string');
      return '';
    } catch (error) {
      console.log('Error getting birthdate:', error);
      return '';
    }
  }

  /**
   * Get patient ID
   */
  async getPatientId(): Promise<string> {
    try {
      // Look for Patient ID pattern
      const patientIdSection = this.page.locator('text="Patient ID"').locator('..');
      const patientIdText = await patientIdSection.textContent();
      // Extract ID from text like "Patient ID 100N07"
      const match = patientIdText?.match(/Patient ID\s*(.+)/);
      return match?.[1]?.trim() || '';
    } catch {
      return '';
    }
  }

  /**
   * Get complete patient information
   */
  async getPatientInfo(): Promise<PatientInfo> {
    // const fullName = await this.getPatientFullName();
    const givenName = await this.getPatientGivenName();
    console.log('Patient given name:', givenName);
    const familyName = await this.getPatientFamilyName();
    console.log('Patient family name:', familyName);
    const gender = await this.getPatientGender();
    console.log('Gender: ', gender);
    const age = await this.getPatientAge();
    const birthdate = await this.getPatientBirthdate();
    const patientId = await this.getPatientId();

    return {
      givenName,
      familyName,
      gender,
      age,
      birthdate,
      patientId,
    };
  }

  /**
   * Check if patient has contact information visible
   */
  async hasContactInfo(): Promise<boolean> {
    // First try to expand contact info if button is available
    const showContactButton = await this.showContactInfoButton.isVisible().catch(() => false);
    if (showContactButton) {
      await this.showContactInfoButton.click();
      await this.page.waitForTimeout(1000);
    }

    const hasAddress = await this.patientAddress.isVisible().catch(() => false);
    const hasPhone = await this.patientPhone.isVisible().catch(() => false);

    return hasAddress || hasPhone;
  }

  /**
   * Get patient's contact information
   */
  async getPatientContact(): Promise<PatientContact> {
    await this.hasContactInfo(); // This will expand contact info if needed

    const address = await this.patientAddress.textContent().catch(() => null);
    const phone = await this.patientPhone.textContent().catch(() => null);

    return {
      address: address?.trim() || undefined,
      phoneNumber: phone?.trim() || undefined,
    };
  }

  /**
   * Check if patient has relatives/family members
   */
  async hasRelatives(): Promise<boolean> {
    try {
      await this.familySection.waitFor({ timeout: 5000 });
      const familyContent = await this.familyList.textContent();

      // Check if family section shows "None" or is empty
      const hasNoFamily =
        familyContent?.toLowerCase().includes('none') || familyContent?.trim() === '';

      return !hasNoFamily;
    } catch {
      return false;
    }
  }

  /**
   * Get list of patient's relatives
   */
  async getPatientRelatives(): Promise<PatientRelativeInfo[]> {
    try {
      const hasFamily = await this.hasRelatives();
      if (!hasFamily) {
        return [];
      }

      // This would need to be customized based on actual HTML structure
      const relatives: PatientRelativeInfo[] = [];
      const relativeElements = await this.relativesItems.all();

      for (const element of relativeElements) {
        const text = await element.textContent();
        if (text && !text.toLowerCase().includes('none')) {
          // Parse relative info - this would need adjustment based on actual format
          relatives.push({
            name: text.trim(),
            relationship: 'Unknown', // Would extract from actual structure
          });
        }
      }

      return relatives;
    } catch {
      return [];
    }
  }

  /**
   * Verify patient was registered successfully by checking key elements
   * Only validates name, gender that are visible on patient detail page
   */
  async verifyPatientRegistration(expectedPatientData: {
    givenName: string;
    familyName: string;
    gender: 'M' | 'F';
  }): Promise<boolean> {
    try {
      // Check if we're on patient detail page
      if (!(await this.isOnPatientDetailPage())) {
        console.log('Not on patient detail page');
        return false;
      }

      // Get full name from page heading
      const givenName = await this.getPatientGivenName();
      console.log('givenName name on page:', givenName);
      const familyName = await this.getPatientFamilyName();
      console.log('familyName name on page:', familyName);

      // Verify name contains expected given and family names
      const givenNameMatch = givenName
        .toLowerCase()
        .includes(expectedPatientData.givenName.toLowerCase());
      const familyNameMatch = familyName
        .toLowerCase()
        .includes(expectedPatientData.familyName.toLowerCase());

      console.log(
        'Given name match:',
        givenNameMatch,
        `(looking for "${expectedPatientData.givenName}" in "${givenName}")`
      );
      console.log(
        'Family name match:',
        familyNameMatch,
        `(looking for "${expectedPatientData.familyName}" in "${familyName}")`
      );

      // Verify gender
      const gender = await this.getPatientGender();
      const expectedGender = expectedPatientData.gender === 'M' ? 'Male' : 'Female';
      const genderMatch = gender.includes(expectedGender);

      console.log(
        'Gender match:',
        genderMatch,
        `(expected "${expectedGender}", found "${gender}")`
      );

      return givenNameMatch && familyNameMatch && genderMatch;
    } catch (error) {
      console.error('Error verifying patient registration:', error);
      return false;
    }
  }

  /**
   * Get success message for registration
   */
  async getRegistrationSuccessMessage(): Promise<string> {
    const patientInfo = await this.getPatientInfo();
    return `${patientInfo.fullName} successfully registered`;
  }

  /**
   * Check if specific section exists and has content
   */
  async hasSectionWithContent(
    sectionName: 'diagnoses' | 'observations' | 'visits' | 'conditions' | 'allergies'
  ): Promise<boolean> {
    try {
      let sectionElement: Locator;

      switch (sectionName) {
        case 'diagnoses':
          sectionElement = this.diagnosesSection;
          break;
        case 'observations':
          sectionElement = this.observationsSection;
          break;
        case 'visits':
          sectionElement = this.visitsSection;
          break;
        case 'conditions':
          sectionElement = this.conditionsSection;
          break;
        case 'allergies':
          sectionElement = this.allergiesSection;
          break;
        default:
          return false;
      }

      await sectionElement.waitFor({ timeout: 3000 });
      const sectionContent = await sectionElement.locator('..').textContent();

      // Check if section has meaningful content (not just "None" or empty)
      const hasContent =
        sectionContent &&
        !sectionContent.toLowerCase().includes('none') &&
        sectionContent.trim() !== '';

      return !!hasContent;
    } catch {
      return false;
    }
  }

  /**
   * Click on action button
   */
  async clickAction(action: 'startVisit' | 'editRegistration' | 'deletePatient'): Promise<void> {
    let button: Locator;

    switch (action) {
      case 'startVisit':
        button = this.startVisitButton;
        break;
      case 'editRegistration':
        button = this.editRegistrationButton;
        break;
      case 'deletePatient':
        button = this.deletePatientButton;
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    await button.click();
  }

  /**
   * Get patient's diagnoses data
   */
  async getPatientDiagnoses(): Promise<PatientDiagnosis[]> {
    try {
      const diagnoses: PatientDiagnosis[] = [];

      // Check if diagnoses section exists
      const hasDiagnoses = await this.hasSectionWithContent('diagnoses');
      if (!hasDiagnoses) {
        console.log('No diagnoses section found or no content');
        return diagnoses;
      }

      // Try multiple selectors to find diagnosis entries
      const diagnosisSelectors = [
        'h3:has-text("DIAGNOSES") ~ ul li, h3:has-text("DIAGNOSES") ~ ol li',
        'h3:has-text("DIAGNOSES") ~ div .diagnosis-item, h3:has-text("DIAGNOSES") ~ div .condition',
        'h3:has-text("DIAGNOSES") + * tr, h3:has-text("DIAGNOSES") ~ table tr',
      ];

      for (const selector of diagnosisSelectors) {
        const elements = this.page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
          console.log(`Found ${count} diagnosis elements with selector: ${selector}`);

          for (let i = 0; i < count; i++) {
            const element = elements.nth(i);
            const text = await element.textContent();

            if (text && !text.toLowerCase().includes('none')) {
              diagnoses.push({
                condition: text.trim(),
                status: 'Active', // Default status, could be extracted from UI
                date: undefined, // Would need specific extraction logic
              });
            }
          }
          break; // Use first successful selector
        }
      }

      console.log(`Extracted ${diagnoses.length} diagnoses`);
      return diagnoses;
    } catch (error) {
      console.error('Error getting patient diagnoses:', error);
      return [];
    }
  }

  /**
   * Get patient's recent visits data
   */
  async getPatientVisits(): Promise<PatientVisit[]> {
    try {
      const visits: PatientVisit[] = [];

      // Check if visits section exists
      const hasVisits = await this.hasSectionWithContent('visits');
      if (!hasVisits) {
        console.log('No recent visits section found or no content');
        return visits;
      }

      // Try multiple selectors to find visit entries
      const visitSelectors = [
        'h3:has-text("RECENT VISITS") ~ ul li, h3:has-text("RECENT VISITS") ~ ol li',
        'h3:has-text("RECENT VISITS") ~ div .visit-item, h3:has-text("RECENT VISITS") ~ div .visit',
        'h3:has-text("RECENT VISITS") + * tr, h3:has-text("RECENT VISITS") ~ table tr',
      ];

      for (const selector of visitSelectors) {
        const elements = this.page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
          console.log(`Found ${count} visit elements with selector: ${selector}`);

          for (let i = 0; i < count; i++) {
            const element = elements.nth(i);
            const text = await element.textContent();

            if (text && !text.toLowerCase().includes('none')) {
              visits.push({
                date: text.trim(), // This would need better parsing
                visitType: undefined,
                location: undefined,
                provider: undefined,
              });
            }
          }
          break; // Use first successful selector
        }
      }

      console.log(`Extracted ${visits.length} visits`);
      return visits;
    } catch (error) {
      console.error('Error getting patient visits:', error);
      return [];
    }
  }

  /**
   * Get patient's latest observations data
   */
  async getPatientObservations(): Promise<PatientObservation[]> {
    try {
      const observations: PatientObservation[] = [];

      // Check if observations section exists
      const hasObservations = await this.hasSectionWithContent('observations');
      if (!hasObservations) {
        console.log('No latest observations section found or no content');
        return observations;
      }

      // Try multiple selectors to find observation entries
      const observationSelectors = [
        'h3:has-text("LATEST OBSERVATIONS") ~ ul li, h3:has-text("LATEST OBSERVATIONS") ~ ol li',
        'h3:has-text("LATEST OBSERVATIONS") ~ div .observation-item, h3:has-text("LATEST OBSERVATIONS") ~ div .obs',
        'h3:has-text("LATEST OBSERVATIONS") + * tr, h3:has-text("LATEST OBSERVATIONS") ~ table tr',
      ];

      for (const selector of observationSelectors) {
        const elements = this.page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
          console.log(`Found ${count} observation elements with selector: ${selector}`);

          for (let i = 0; i < count; i++) {
            const element = elements.nth(i);
            const text = await element.textContent();

            if (text && !text.toLowerCase().includes('none')) {
              // Try to parse observation text like "Weight: 70 kg" or "Blood Pressure: 120/80 mmHg"
              const match = text.match(/([^:]+):\s*(.+)/);
              if (match) {
                const [, name, valueWithUnit] = match;
                const valueMatch = valueWithUnit.match(/([\d.,]+)\s*([^\d\s]*)/);

                observations.push({
                  name: name.trim(),
                  value: valueMatch ? valueMatch[1] : valueWithUnit.trim(),
                  unit: valueMatch ? valueMatch[2].trim() || undefined : undefined,
                  date: undefined, // Would need specific extraction logic
                });
              } else {
                // Fallback for non-standard format
                observations.push({
                  name: 'Unknown',
                  value: text.trim(),
                  unit: undefined,
                  date: undefined,
                });
              }
            }
          }
          break; // Use first successful selector
        }
      }

      console.log(`Extracted ${observations.length} observations`);
      return observations;
    } catch (error) {
      console.error('Error getting patient observations:', error);
      return [];
    }
  }

  /**
   * Get patient's vitals data
   */
  async getPatientVitals(): Promise<PatientVitals> {
    try {
      const vitals: PatientVitals = {};

      // Try to find vitals section
      const vitalsSelectors = [
        'h3:has-text("VITALS")',
        'h3:has-text("VITAL SIGNS")',
        '[class*="vitals"]',
        '[class*="vital-signs"]',
      ];

      let vitalsSection = null;
      for (const selector of vitalsSelectors) {
        const element = this.page.locator(selector);
        if (await element.isVisible().catch(() => false)) {
          vitalsSection = element;
          break;
        }
      }

      if (!vitalsSection) {
        // Try to extract vitals from observations
        const observations = await this.getPatientObservations();
        for (const obs of observations) {
          const name = obs.name.toLowerCase();
          const value = obs.value + (obs.unit ? ` ${obs.unit}` : '');

          if (name.includes('blood pressure') || name.includes('bp')) {
            vitals.bloodPressure = value;
          } else if (name.includes('temperature') || name.includes('temp')) {
            vitals.temperature = value;
          } else if (name.includes('heart rate') || name.includes('pulse') || name.includes('hr')) {
            vitals.heartRate = value;
          } else if (name.includes('weight')) {
            vitals.weight = value;
          } else if (name.includes('height')) {
            vitals.height = value;
          } else if (name.includes('bmi')) {
            vitals.bmi = value;
          }
        }
      } else {
        // Extract from dedicated vitals section
        const vitalsContent = await vitalsSection.locator('..').textContent();
        if (vitalsContent) {
          // Parse vital signs from text content
          const bpMatch = vitalsContent.match(/blood pressure[:\s]*([\d\/]+)/i);
          if (bpMatch) vitals.bloodPressure = bpMatch[1];

          const tempMatch = vitalsContent.match(/temperature[:\s]*([\d.]+\s*[°CF]*)/i);
          if (tempMatch) vitals.temperature = tempMatch[1];

          const hrMatch = vitalsContent.match(/heart rate|pulse[:\s]*([\d]+)/i);
          if (hrMatch) vitals.heartRate = hrMatch[1];

          const weightMatch = vitalsContent.match(/weight[:\s]*([\d.]+\s*\w*)/i);
          if (weightMatch) vitals.weight = weightMatch[1];

          const heightMatch = vitalsContent.match(/height[:\s]*([\d.]+\s*\w*)/i);
          if (heightMatch) vitals.height = heightMatch[1];

          const bmiMatch = vitalsContent.match(/bmi[:\s]*([\d.]+)/i);
          if (bmiMatch) vitals.bmi = bmiMatch[1];
        }
      }

      console.log('Extracted vitals:', vitals);
      return vitals;
    } catch (error) {
      console.error('Error getting patient vitals:', error);
      return {};
    }
  }

  /**
   * Get comprehensive patient data including all sections
   */
  async getComprehensivePatientData(): Promise<{
    basicInfo: PatientInfo;
    contact: PatientContact;
    relatives: PatientRelativeInfo[];
    diagnoses: PatientDiagnosis[];
    visits: PatientVisit[];
    observations: PatientObservation[];
    vitals: PatientVitals;
  }> {
    console.log('Getting comprehensive patient data...');

    const [basicInfo, contact, relatives, diagnoses, visits, observations, vitals] =
      await Promise.all([
        this.getPatientInfo(),
        this.getPatientContact(),
        this.getPatientRelatives(),
        this.getPatientDiagnoses(),
        this.getPatientVisits(),
        this.getPatientObservations(),
        this.getPatientVitals(),
      ]);

    const comprehensiveData = {
      basicInfo,
      contact,
      relatives,
      diagnoses,
      visits,
      observations,
      vitals,
    };

    console.log('Comprehensive patient data collected:', {
      basicInfo: !!basicInfo.fullName,
      contact: !!(contact.address || contact.phoneNumber),
      relativesCount: relatives.length,
      diagnosesCount: diagnoses.length,
      visitsCount: visits.length,
      observationsCount: observations.length,
      vitalsFound: Object.keys(vitals).length,
    });

    return comprehensiveData;
  }
}
