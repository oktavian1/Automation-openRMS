import { test, expect, testConfig } from '../fixtures/test-fixtures';

test.describe('Login Tests', () => {
  test.beforeEach(async ({ page }) => {
   
    await page.context().clearCookies();
  });

  test(`${testConfig.tags.SMOKE} ${testConfig.tags.CRITICAL} should login with valid admin credentials`, async ({ 
      loginPage, 
      homePage, 
      adminUser 
    }) => {

      await loginPage.goto();
      expect(await loginPage.isLoginPageDisplayed()).toBe(true);

      await loginPage.login(adminUser.username, adminUser.password, adminUser.location);

      await homePage.waitForPageLoad();
      expect(await homePage.isLoggedIn()).toBe(true);

      const dataLoginUser = await homePage.getWelcomeMessageParts();

      expect(dataLoginUser).not.toBeNull();
      expect(dataLoginUser?.userInfo).toBe(adminUser.username);  
      expect(dataLoginUser?.ward).toBe(adminUser.location);   
  });


  test(`${testConfig.tags.SMOKE} should show error message with invalid credentials`, async ({ 
    loginPage 
  }) => {
    await loginPage.goto();
    await loginPage.login('invalid-user', 'wrong-password', 'Inpatient Ward');
    expect(await loginPage.isErrorVisible()).toBe(true);
    const errorMessage = await loginPage.getErrorMessage();
    console.log('Error message displayed:', errorMessage);
    expect(errorMessage).toBe('Invalid username/password. Please try again.');
  });

  test(`${testConfig.tags.REGRESSION} should show error with empty username and stay at login page`, async ({ 
    loginPage 
  }) => {
    await loginPage.goto();
    
    await loginPage.fillUsername('');
    await loginPage.fillPassword('Admin123');
    await loginPage.selectLocation('Inpatient Ward');
    await loginPage.clickLogin();
    
    expect(await loginPage.isLoginPageDisplayed()).toBe(true);
  });

  test(`${testConfig.tags.REGRESSION} should show error with empty password stay at login page`, async ({ 
    loginPage 
  }) => {
    await loginPage.goto();
    
    await loginPage.fillUsername('admin');
    await loginPage.fillPassword('');
    await loginPage.selectLocation('Inpatient Ward');
    await loginPage.clickLogin();
    
    expect(await loginPage.isLoginPageDisplayed()).toBe(true);
  });

  test(`${testConfig.tags.REGRESSION} should handle different valid locations`, async ({ 
    loginPage, 
    homePage, 
    adminUser 
  }) => {
    for (const location of testConfig.testData.VALID_LOCATIONS) {
      // Clear any existing session
      await loginPage.page.context().clearCookies();
      
      await loginPage.goto();
      await loginPage.login(adminUser.username, adminUser.password, location);
      
      // Verify login success
      await homePage.waitForPageLoad();
      expect(await homePage.isLoggedIn()).toBe(true);

      const dataLoginUser = await homePage.getWelcomeMessageParts();

      expect(dataLoginUser).not.toBeNull();
      expect(dataLoginUser?.userInfo).toBe(adminUser.username);  
      expect(dataLoginUser?.ward).toBe(location);   
      
      await homePage.logout();
    }
  });

  test.describe('Data-driven login tests', () => {
    testConfig.testData.INVALID_CREDENTIALS.forEach((credentials, index) => {
      test(`${testConfig.tags.REGRESSION} should reject invalid credentials set ${index + 1}`, async ({ 
        loginPage 
      }) => {
        await loginPage.goto();
        
        await loginPage.login(credentials.username, credentials.password, credentials.location);
        
       
        const isStillOnLogin = await loginPage.isLoginPageDisplayed();
        const hasError = await loginPage.isErrorVisible();
        
        expect(isStillOnLogin || hasError).toBe(true);
      });
    });
  });

});