import { APIRequestContext } from '@playwright/test';

/**
 * API helper class for OpenMRS REST API interactions
 */
export class ApiHelpers {
  private apiContext: APIRequestContext;
  private baseURL: string;
  private sessionId?: string;

  constructor(apiContext: APIRequestContext, baseURL: string = process.env.BASE_URL || 'https://o2.openmrs.org') {
    this.apiContext = apiContext;
    this.baseURL = baseURL;
  }

  /**
   * Authenticate with OpenMRS API
   */
  async authenticate(username: string, password: string): Promise<void> {
    try {
      const response = await this.apiContext.post(`${this.baseURL}/openmrs/ws/rest/v1/session`, {
        data: { username, password },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok()) {
        const sessionData = await response.json();
        this.sessionId = sessionData.sessionId;
      } else {
        throw new Error(`Authentication failed: ${response.status()} ${response.statusText()}`);
      }
    } catch (error) {
      console.error('API Authentication error:', error);
      throw error;
    }
  }

  /**
   * Get request headers with authentication
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionId) {
      headers['Cookie'] = `JSESSIONID=${this.sessionId}`;
    }

    return headers;
  }

  /**
   * Create a test patient via API
   */
  async createTestPatient(patientData: {
    givenName: string;
    familyName: string;
    gender: 'M' | 'F';
    birthdate: string;
    address1?: string;
    cityVillage?: string;
    country?: string;
  }): Promise<{ uuid: string; id: string }> {
    try {
      const payload = {
        person: {
          names: [{
            givenName: patientData.givenName,
            familyName: patientData.familyName
          }],
          gender: patientData.gender,
          birthdate: patientData.birthdate,
          addresses: patientData.address1 ? [{
            address1: patientData.address1,
            cityVillage: patientData.cityVillage || '',
            country: patientData.country || ''
          }] : []
        }
      };

      const response = await this.apiContext.post(`${this.baseURL}/openmrs/ws/rest/v1/patient`, {
        data: payload,
        headers: this.getHeaders()
      });

      if (response.ok()) {
        const patient = await response.json();
        return {
          uuid: patient.uuid,
          id: patient.identifiers?.[0]?.identifier || patient.uuid
        };
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to create patient: ${response.status()} ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to create test patient:', error);
      throw error;
    }
  }

  /**
   * Delete a patient via API
   */
  async deletePatient(patientUuid: string): Promise<void> {
    try {
      const response = await this.apiContext.delete(`${this.baseURL}/openmrs/ws/rest/v1/patient/${patientUuid}`, {
        headers: this.getHeaders()
      });

      if (!response.ok()) {
        console.warn(`Failed to delete patient ${patientUuid}: ${response.status()}`);
      }
    } catch (error) {
      console.error('Failed to delete patient:', error);
      // Don't throw here as this is cleanup - log and continue
    }
  }

  /**
   * Search for patients via API
   */
  async searchPatients(query: string): Promise<Array<{
    uuid: string;
    display: string;
    identifiers: Array<{ identifier: string }>;
    person: {
      gender: string;
      age: number;
      names: Array<{ display: string }>;
    };
  }>> {
    try {
      const response = await this.apiContext.get(`${this.baseURL}/openmrs/ws/rest/v1/patient`, {
        params: { q: query, v: 'full' },
        headers: this.getHeaders()
      });

      if (response.ok()) {
        const data = await response.json();
        return data.results || [];
      } else {
        throw new Error(`Patient search failed: ${response.status()}`);
      }
    } catch (error) {
      console.error('Patient search error:', error);
      return [];
    }
  }

  /**
   * Get patient by UUID
   */
  async getPatient(patientUuid: string): Promise<any> {
    try {
      const response = await this.apiContext.get(`${this.baseURL}/openmrs/ws/rest/v1/patient/${patientUuid}`, {
        params: { v: 'full' },
        headers: this.getHeaders()
      });

      if (response.ok()) {
        return await response.json();
      } else {
        throw new Error(`Failed to get patient: ${response.status()}`);
      }
    } catch (error) {
      console.error('Failed to get patient:', error);
      throw error;
    }
  }

  /**
   * Create multiple test patients
   */
  async createMultipleTestPatients(patientsData: Array<{
    givenName: string;
    familyName: string;
    gender: 'M' | 'F';
    birthdate: string;
    address1?: string;
    cityVillage?: string;
    country?: string;
  }>): Promise<Array<{ uuid: string; id: string }>> {
    const createdPatients = [];
    
    for (const patientData of patientsData) {
      try {
        const patient = await this.createTestPatient(patientData);
        createdPatients.push(patient);
      } catch (error) {
        console.error(`Failed to create patient ${patientData.givenName} ${patientData.familyName}:`, error);
      }
    }
    
    return createdPatients;
  }

  /**
   * Clean up multiple patients
   */
  async cleanupPatients(patientUuids: string[]): Promise<void> {
    const cleanupPromises = patientUuids.map(uuid => this.deletePatient(uuid));
    await Promise.allSettled(cleanupPromises);
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<any> {
    try {
      const response = await this.apiContext.get(`${this.baseURL}/openmrs/ws/rest/v1/systeminfo`, {
        headers: this.getHeaders()
      });

      if (response.ok()) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get system info:', error);
    }
    return null;
  }

  /**
   * Get all locations
   */
  async getLocations(): Promise<Array<{ uuid: string; name: string; display: string }>> {
    try {
      const response = await this.apiContext.get(`${this.baseURL}/openmrs/ws/rest/v1/location`, {
        params: { v: 'full' },
        headers: this.getHeaders()
      });

      if (response.ok()) {
        const data = await response.json();
        return data.results || [];
      }
    } catch (error) {
      console.error('Failed to get locations:', error);
    }
    return [];
  }

  /**
   * Verify API connectivity
   */
  async verifyConnectivity(): Promise<boolean> {
    try {
      const response = await this.apiContext.get(`${this.baseURL}/openmrs/ws/rest/v1/session`, {
        timeout: 5000
      });
      return response.ok();
    } catch {
      return false;
    }
  }

  /**
   * Logout from API session
   */
  async logout(): Promise<void> {
    if (this.sessionId) {
      try {
        await this.apiContext.delete(`${this.baseURL}/openmrs/ws/rest/v1/session`, {
          headers: this.getHeaders()
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.sessionId = undefined as any;
      }
    }
  }
}

/**
 * Test data seeding utilities
 */
export class DataSeeder {
  private apiHelpers: ApiHelpers;
  private createdPatients: string[] = [];

  constructor(apiHelpers: ApiHelpers) {
    this.apiHelpers = apiHelpers;
  }

  /**
   * Seed test patients for search testing
   */
  async seedPatientsForSearch(): Promise<Array<{ uuid: string; id: string; name: string }>> {
    const testPatients = [
      { givenName: 'John', familyName: 'Doe', gender: 'M' as const, birthdate: '1990-01-01' },
      { givenName: 'Jane', familyName: 'Smith', gender: 'F' as const, birthdate: '1985-05-15' },
      { givenName: 'Michael', familyName: 'Johnson', gender: 'M' as const, birthdate: '1980-12-25' }
    ];

    const createdPatients = [];
    for (const patientData of testPatients) {
      try {
        const patient = await this.apiHelpers.createTestPatient(patientData);
        this.createdPatients.push(patient.uuid);
        createdPatients.push({
          ...patient,
          name: `${patientData.givenName} ${patientData.familyName}`
        });
      } catch (error) {
        console.error('Failed to seed patient:', error);
      }
    }

    return createdPatients;
  }

  /**
   * Cleanup all seeded data
   */
  async cleanup(): Promise<void> {
    if (this.createdPatients.length > 0) {
      await this.apiHelpers.cleanupPatients(this.createdPatients);
      this.createdPatients = [];
    }
  }
}

/**
 * Create API helpers instance with authentication
 */
export async function createAuthenticatedApiHelpers(
  apiContext: APIRequestContext,
  username: string = process.env.ADMIN_USER || 'admin',
  password: string = process.env.ADMIN_PASS || 'Admin123'
): Promise<ApiHelpers> {
  const apiHelpers = new ApiHelpers(apiContext);
  await apiHelpers.authenticate(username, password);
  return apiHelpers;
}