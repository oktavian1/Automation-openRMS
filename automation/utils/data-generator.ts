import { faker } from '@faker-js/faker';
import type { PatientData, RelativeData } from '../pages/RegistrationPage';

/**
 * Generate random patient data for testing
 */
export function generatePatientData(): PatientData {
  const gender = faker.person.sex() === 'male' ? 'M' : 'F';
  const firstName = gender === 'M' ? faker.person.firstName('male') : faker.person.firstName('female');
  const lastName = faker.person.lastName();
  
  // Generate birthdate between 18-80 years old
  const birthdate = faker.date.birthdate({ min: 18, max: 80, mode: 'age' });
  
  return {
    givenName: firstName,
    familyName: lastName,
    gender,
    birthdate: formatDateForInput(birthdate),
    address1: faker.location.streetAddress(),
    cityVillage: faker.location.city(),
    country: faker.location.country(),
    phoneNumber: faker.phone.number('###-###-####'),
    relatives: generateRandomRelatives()
  };
}

/**
 * Generate multiple patient data entries
 */
export function generateMultiplePatients(count: number): PatientData[] {
  return Array.from({ length: count }, () => generatePatientData());
}

/**
 * Generate patient data with specific criteria
 */
export function generatePatientDataWithCriteria(criteria: {
  gender?: 'M' | 'F';
  minAge?: number;
  maxAge?: number;
  country?: string;
}): PatientData {
  const gender = criteria.gender || (faker.person.sex() === 'male' ? 'M' : 'F');
  const firstName = gender === 'M' ? faker.person.firstName('male') : faker.person.firstName('female');
  const lastName = faker.person.lastName();
  
  const minAge = criteria.minAge || 18;
  const maxAge = criteria.maxAge || 80;
  const birthdate = faker.date.birthdate({ min: minAge, max: maxAge, mode: 'age' });
  
  return {
    givenName: firstName,
    familyName: lastName,
    gender,
    birthdate: formatDateForInput(birthdate),
    address1: faker.location.streetAddress(),
    cityVillage: faker.location.city(),
    country: criteria.country || faker.location.country(),
    phoneNumber: faker.phone.number('###-###-####'),
    relatives: generateRandomRelatives()
  };
}

/**
 * Generate invalid patient data for negative testing
 */
export function generateInvalidPatientData(): Partial<PatientData> {
  const scenarios = [
    // Missing required fields
    { givenName: '', familyName: faker.person.lastName(), gender: 'M' as const, birthdate: formatDateForInput(faker.date.past()) },
    { givenName: faker.person.firstName(), familyName: '', gender: 'F' as const, birthdate: formatDateForInput(faker.date.past()) },
    { givenName: faker.person.firstName(), familyName: faker.person.lastName(), gender: 'M' as const, birthdate: '' },
    
    // Invalid data formats
    { givenName: 'John123!@#', familyName: faker.person.lastName(), gender: 'M' as const, birthdate: formatDateForInput(faker.date.past()) },
    { givenName: faker.person.firstName(), familyName: faker.person.lastName(), gender: 'M' as const, birthdate: 'invalid-date' },
    { givenName: faker.person.firstName(), familyName: faker.person.lastName(), gender: 'M' as const, birthdate: formatDateForInput(faker.date.future()) }, // Future date
  ];
  
  return faker.helpers.arrayElement(scenarios);
}

/**
 * Generate user credentials for testing
 */
export function generateUserCredentials() {
  return {
    username: faker.internet.userName(),
    password: faker.internet.password({ length: 12 }),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName()
  };
}

/**
 * Generate search queries for patient search testing
 */
export function generateSearchQueries(): {
  valid: string[];
  invalid: string[];
  edge: string[];
} {
  return {
    valid: [
      faker.person.firstName(),
      faker.person.lastName(),
      faker.person.fullName(),
      faker.datatype.number({ min: 100000, max: 999999 }).toString(), // Patient ID format
    ],
    invalid: [
      '', // Empty search
      '   ', // Whitespace only
      '!@#$%', // Special characters only
    ],
    edge: [
      'a', // Single character
      'ab', // Two characters
      'x'.repeat(100), // Very long string
      '123', // Numbers only
      'John Doe Jr. III', // Complex name with titles
    ]
  };
}

/**
 * Generate address data
 */
export function generateAddressData() {
  return {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    country: faker.location.country(),
    postalCode: faker.location.zipCode(),
    fullAddress: faker.location.streetAddress({ useFullAddress: true })
  };
}

/**
 * Generate contact information
 */
export function generateContactData() {
  return {
    phone: faker.phone.number('###-###-####'),
    mobile: faker.phone.number('###-###-####'),
    email: faker.internet.email(),
    emergencyContact: {
      name: faker.person.fullName(),
      relationship: faker.helpers.arrayElement(['Spouse', 'Parent', 'Sibling', 'Friend', 'Other']),
      phone: faker.phone.number('###-###-####')
    }
  };
}

/**
 * Generate random relatives (0-3 relatives)
 */
export function generateRandomRelatives(): RelativeData[] {
  const relationshipTypes = [
    'Parent',
    'Sibling', 
    'Child',
    'Aunt/Uncle',
    'Supervisor',
    'Patient',
    'Niece/Nephew',
    'Doctor'
  ];
  
  // Random number of relatives (0-3)
  const count = faker.datatype.number({ min: 0, max: 3 });
  
  const relatives: RelativeData[] = [];
  
  for (let i = 0; i < count; i++) {
    relatives.push({
      relationshipType: faker.helpers.arrayElement(relationshipTypes),
      personName: faker.person.fullName()
    });
  }
  
  return relatives;
}

/**
 * Generate specific number of relatives
 */
export function generateRelatives(count: number): RelativeData[] {
  const relationshipTypes = [
    'Parent',
    'Sibling', 
    'Child',
    'Aunt/Uncle',
    'Supervisor',
    'Patient',
    'Niece/Nephew',
    'Doctor'
  ];
  
  const relatives: RelativeData[] = [];
  
  for (let i = 0; i < count; i++) {
    relatives.push({
      relationshipType: faker.helpers.arrayElement(relationshipTypes),
      personName: faker.person.fullName()
    });
  }
  
  return relatives;
}

/**
 * Generate medical data for testing
 */
export function generateMedicalData() {
  return {
    bloodType: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    allergies: faker.helpers.arrayElements(['Penicillin', 'Shellfish', 'Nuts', 'Latex', 'None'], { min: 0, max: 3 }),
    medications: faker.helpers.arrayElements(['Aspirin', 'Ibuprofen', 'Lisinopril', 'Metformin', 'None'], { min: 0, max: 2 }),
    conditions: faker.helpers.arrayElements(['Diabetes', 'Hypertension', 'Asthma', 'None'], { min: 0, max: 2 })
  };
}

/**
 * Utility functions
 */

/**
 * Format date for form input (YYYY-MM-DD)
 */
function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Generate date range
 */
export function generateDateRange(startDaysAgo: number = 30, endDaysAgo: number = 0): {
  startDate: string;
  endDate: string;
} {
  const endDate = faker.date.recent({ days: endDaysAgo });
  const startDate = faker.date.recent({ days: startDaysAgo });
  
  return {
    startDate: formatDateForInput(startDate),
    endDate: formatDateForInput(endDate)
  };
}

/**
 * Generate random choice from array
 */
export function randomChoice<T>(array: T[]): T {
  return faker.helpers.arrayElement(array);
}

/**
 * Generate random number in range
 */
export function randomNumber(min: number = 1, max: number = 100): number {
  return faker.datatype.number({ min, max });
}

/**
 * Generate unique identifier
 */
export function generateUniqueId(prefix: string = 'id'): string {
  return `${prefix}_${faker.datatype.uuid()}`;
}

/**
 * Seed faker for consistent test data (use in beforeAll)
 */
export function seedFaker(seed: number): void {
  faker.seed(seed);
}