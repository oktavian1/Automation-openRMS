import { test, expect, testConfig } from '../fixtures/test-fixtures';
import {
  generateInvalidPatientData,
  generatePatientDataWithCriteria,
} from '../utils/data-generator';
import { RelativeData } from '../pages/RegistrationPage';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { RegistrationPage } from '../pages/RegistrationPage';

test.describe('Patient Registration Tests', () => {
  test.describe.configure({ timeout: 180000 }); // 3 minutes

  test.beforeEach(async ({ page }) => {
    console.log('Setting up registration test (simplified approach)...');

    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);
    // const registrationPage = new RegistrationPage(page);

    try {
      await loginPage.goto();
      await loginPage.login('admin', 'Admin123');
      await homePage.waitForPageLoad();
    } catch (error) {
      console.error('Error during setup:', error);

      throw error;
    }
  });

  test(`${testConfig.tags.SMOKE} ${testConfig.tags.CRITICAL} should display patient registration form`, async ({
    registrationPage,
    homePage,
  }) => {
    const simpleIsVisible = await homePage.simpleRegisterPatientIsVisible();
    if (!simpleIsVisible) {
      console.log('Simple Register Patient link not visible, using standard register link');
      await homePage.goToRegisterPatient();
    } else {
      await homePage.goToRegisterPatientSimple();
    }
    await expect(registrationPage.givenNameField).toBeVisible();
    await expect(registrationPage.middleNameField).toBeVisible();
    await expect(registrationPage.familyNameField).toBeVisible();
    await expect(registrationPage.nextButton).toBeVisible();

    const pageTitle = await registrationPage.getPageTitle();
    expect(pageTitle).toBeTruthy();
  });

  test(`${testConfig.tags.SMOKE} ${testConfig.tags.CRITICAL} should register new patient with required fields only`, async ({
    registrationPage,
    homePage,
    patientDetailPage,
    patientSearchPage,
    testPatient,
  }) => {
    const patienData = testPatient;
    const simpleIsVisible = await homePage.simpleRegisterPatientIsVisible();

    if (!simpleIsVisible) {
      console.log('Simple Register Patient link not visible, using standard register link');
      await homePage.goToRegisterPatient();
      await registrationPage.waitForPageLoad();
      await registrationPage.registerPatient(testPatient);
    } else {
      // Register patient with simple register
      await registrationPage.simpleRegisterPatient(testPatient);

      await homePage.waitForPageLoad();
      expect(await homePage.isOnHomePage()).toBe(true);

      await homePage.goToFindPatient();
      await patientSearchPage.waitForPageLoad();

      const searchResult = await patientSearchPage.searchPatient(
        `${patienData.givenName} ${patienData.familyName}`
      );

      console.log('Search Result:', searchResult);

      expect(searchResult.success).toBe(true);

      await patientSearchPage.selectPatient(searchResult.patients[0].index);
    }
    await patientDetailPage.waitForPageLoad();
    expect(await patientDetailPage.isOnPatientDetailPage()).toBe(true);

    // Verify patient data matches what was registered
    const patientInfo = await patientDetailPage.getPatientInfo();
    console.log('Registered Patient Info:', {
      givenName: patientInfo.givenName,
      familyName: patientInfo.familyName,
      gender: patientInfo.gender,
      birthdate: patientInfo.birthdate,
      patientId: patientInfo.patientId,
    });

    console.log('ini patient info', patientInfo);

    // Verify the core data matches
    const isRegistrationValid = await patientDetailPage.verifyPatientRegistration({
      givenName: testPatient.givenName,
      familyName: testPatient.familyName,
      gender: testPatient.gender,
    });
    expect(isRegistrationValid).toBe(true);
  });

  test(`${testConfig.tags.REGRESSION} should register male patient`, async ({
    registrationPage,
    homePage,
    patientDetailPage,
    patientSearchPage,
  }) => {
    const malePatient = generatePatientDataWithCriteria({ gender: 'M' });
    const simpleIsVisible = await homePage.simpleRegisterPatientIsVisible();
    if (!simpleIsVisible) {
      await homePage.goToRegisterPatient();
      await registrationPage.waitForPageLoad();
      await registrationPage.registerPatient(malePatient);
    } else {
      await registrationPage.simpleRegisterPatient(malePatient);

      await homePage.waitForPageLoad();
      expect(await homePage.isOnHomePage()).toBe(true);

      await homePage.goToFindPatient();
      await patientSearchPage.waitForPageLoad();

      const searchResult = await patientSearchPage.searchPatient(
        `${malePatient.givenName} ${malePatient.familyName}`
      );
      console.log('Search Result:', searchResult);
      expect(searchResult.success).toBe(true);

      await patientSearchPage.selectPatient(searchResult.patients[0].index);
    }
    // Register male patient

    await patientDetailPage.waitForPageLoad();
    expect(await patientDetailPage.isOnPatientDetailPage()).toBe(true);

    // Verify patient data matches what was registered
    const patientInfo = await patientDetailPage.getPatientInfo();
    expect(patientInfo.gender).toContain('Male');

    console.log('Male Patient Registered:', {
      name: `${patientInfo.givenName} ${patientInfo.familyName}`,
      gender: patientInfo.gender,
    });
  });

  test(`${testConfig.tags.REGRESSION} should register female patient`, async ({
    registrationPage,
    homePage,
    patientDetailPage,
    patientSearchPage,
  }) => {
    const fefmalePatient = generatePatientDataWithCriteria({ gender: 'F' });
    const simpleIsVisible = await homePage.simpleRegisterPatientIsVisible();

    if (!simpleIsVisible) {
      await homePage.goToRegisterPatient();
      await registrationPage.waitForPageLoad();
      await registrationPage.registerPatient(fefmalePatient);
    } else {
      await registrationPage.simpleRegisterPatient(fefmalePatient);

      await homePage.waitForPageLoad();
      expect(await homePage.isOnHomePage()).toBe(true);

      await homePage.goToFindPatient();
      await patientSearchPage.waitForPageLoad();

      const searchResult = await patientSearchPage.searchPatient(
        `${fefmalePatient.givenName} ${fefmalePatient.familyName}`
      );
      console.log('Search Result:', searchResult);
      expect(searchResult.success).toBe(true);

      await patientSearchPage.selectPatient(searchResult.patients[0].index);
    }
    // Register male patient

    await patientDetailPage.waitForPageLoad();
    expect(await patientDetailPage.isOnPatientDetailPage()).toBe(true);

    // Verify patient data matches what was registered
    const patientInfo = await patientDetailPage.getPatientInfo();
    expect(patientInfo.gender).toContain('Female');

    console.log('Male Patient Registered:', {
      name: `${patientInfo.givenName} ${patientInfo.familyName}`,
      gender: patientInfo.gender,
    });
  });
});
