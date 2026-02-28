/**
 * Geographic Compliance Configuration
 * 
 * Defines allowed/restricted territories for sweepstakes participation
 * based on legal requirements and registration obligations.
 * 
 * LAUNCH STRATEGY:
 * - Start with U.S.-only, 18+ participants
 * - Exclude states with special bonding/registration requirements
 * - Block international territories until proper compliance setup
 */

export const GEOGRAPHIC_CONFIG = {
  // Minimum age requirement
  MINIMUM_AGE: 18,
  
  // Default allowed country
  ALLOWED_COUNTRIES: ['US', 'United States'],
  
  // U.S. States excluded at launch due to special requirements
  EXCLUDED_US_STATES: [
    'NY', 'New York',           // Special bonding requirements
    'FL', 'Florida',            // Registration and bonding requirements  
    'RI', 'Rhode Island',       // Special registration requirements
  ],
  
  // Fully blocked countries/regions
  BLOCKED_COUNTRIES: [
    'CA', 'Canada',             // Québec has complex sweepstakes laws
    'GB', 'UK', 'United Kingdom', // Different gambling regulations
    'FR', 'France',             // EU member - complex compliance
    'DE', 'Germany',            // EU member - complex compliance
    'IT', 'Italy',              // EU member - complex compliance
    'ES', 'Spain',              // EU member - complex compliance
    'NL', 'Netherlands',        // EU member - complex compliance
    'BE', 'Belgium',            // EU member - complex compliance
    'AT', 'Austria',            // EU member - complex compliance
    'PT', 'Portugal',           // EU member - complex compliance
    'IE', 'Ireland',            // EU member - complex compliance
    'DK', 'Denmark',            // EU member - complex compliance
    'SE', 'Sweden',             // EU member - complex compliance
    'FI', 'Finland',            // EU member - complex compliance
    'NO', 'Norway',             // Complex gambling laws
    'CH', 'Switzerland',        // Complex gambling laws
    'AU', 'Australia',          // Different gambling regulations
    'NZ', 'New Zealand',        // Different gambling regulations
    'JP', 'Japan',              // Complex gambling laws
    'CN', 'China',              // Prohibited gambling
    'IN', 'India',              // Complex state-by-state laws
    'BR', 'Brazil',             // Complex gambling laws
    'MX', 'Mexico',             // Different regulations
  ],

  // Blocked provinces/states within allowed countries
  BLOCKED_REGIONS: [
    'QC', 'Quebec',             // Special Québec sweepstakes laws
    'PR', 'Puerto Rico',        // U.S. territory with different laws
    'VI', 'U.S. Virgin Islands', // U.S. territory with different laws
    'GU', 'Guam',               // U.S. territory with different laws
    'AS', 'American Samoa',     // U.S. territory with different laws
    'MP', 'Northern Mariana Islands', // U.S. territory with different laws
  ]
};

// U.S. States and their abbreviations for validation
export const US_STATES = {
  'AL': 'Alabama',
  'AK': 'Alaska', 
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'DC': 'District of Columbia',
  'FL': 'Florida',        // EXCLUDED AT LAUNCH
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',       // EXCLUDED AT LAUNCH
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',   // EXCLUDED AT LAUNCH
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming',
};

// Get list of allowed U.S. states (excluding restricted ones)
export const getAllowedUSStates = () => {
  const excludedCodes = GEOGRAPHIC_CONFIG.EXCLUDED_US_STATES.filter(state => state.length === 2);
  const excludedNames = GEOGRAPHIC_CONFIG.EXCLUDED_US_STATES.filter(state => state.length > 2);
  
  return Object.entries(US_STATES).filter(([code, name]) => {
    return !excludedCodes.includes(code) && !excludedNames.includes(name);
  });
};

/**
 * Validation Functions
 */

export const isCountryAllowed = (country) => {
  if (!country) return false;
  
  const normalizedCountry = country.trim();
  
  // Check if explicitly blocked
  if (GEOGRAPHIC_CONFIG.BLOCKED_COUNTRIES.some(blocked => 
    blocked.toLowerCase() === normalizedCountry.toLowerCase()
  )) {
    return false;
  }
  
  // Check if in allowed countries
  return GEOGRAPHIC_CONFIG.ALLOWED_COUNTRIES.some(allowed => 
    allowed.toLowerCase() === normalizedCountry.toLowerCase()
  );
};

export const isStateAllowed = (state, country = 'US') => {
  if (!state) return false;
  
  const normalizedState = state.trim();
  
  // Only validate for US
  if (country !== 'US' && country !== 'United States') return true;
  
  // Check if state is excluded
  return !GEOGRAPHIC_CONFIG.EXCLUDED_US_STATES.some(excluded => 
    excluded.toLowerCase() === normalizedState.toLowerCase()
  );
};

export const isRegionAllowed = (region) => {
  if (!region) return true;
  
  const normalizedRegion = region.trim();
  
  return !GEOGRAPHIC_CONFIG.BLOCKED_REGIONS.some(blocked => 
    blocked.toLowerCase() === normalizedRegion.toLowerCase()
  );
};

export const validateEligibility = (userData) => {
  const errors = {};
  
  // Age validation
  if (userData.dateOfBirth) {
    const age = calculateAge(userData.dateOfBirth);
    if (age < GEOGRAPHIC_CONFIG.MINIMUM_AGE) {
      errors.age = `Must be ${GEOGRAPHIC_CONFIG.MINIMUM_AGE} years or older`;
    }
  }
  
  // Country validation
  if (!isCountryAllowed(userData.country)) {
    if (GEOGRAPHIC_CONFIG.BLOCKED_COUNTRIES.includes(userData.country)) {
      errors.country = 'Sweepstakes not available in your country at this time';
    } else {
      errors.country = 'Currently only available to U.S. residents';
    }
  }
  
  // State validation (for US residents)
  if (userData.country === 'US' || userData.country === 'United States') {
    if (!isStateAllowed(userData.state)) {
      errors.state = 'Sweepstakes not available in your state at this time';
    }
  }
  
  return {
    isEligible: Object.keys(errors).length === 0,
    errors
  };
};

export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const getEligibilityMessage = () => {
  return `Open to legal residents of the fifty (50) United States and the District of Columbia (excluding New York, Florida, and Rhode Island) who are ${GEOGRAPHIC_CONFIG.MINIMUM_AGE} years of age or older at the time of entry.`;
};

export const getRestrictedRegionsMessage = () => {
  return 'This sweepstakes is void in New York, Florida, Rhode Island, and where prohibited by law. International entries not accepted at this time.';
};
