/**
 * Configurable weights for the matching algorithm
 */
export interface MatchingWeights {
  email: number;
  name: number;
  company: number;
  location: number;
  jobTitle: number;
}

/**
 * Configuration for the matching algorithm
 */
export interface MatchingConfig {
  weights: MatchingWeights;
  algorithm: 'levenshtein' | 'jaro-winkler';
  nameThreshold: number; // Minimum similarity for name matches
  companyThreshold: number; // Minimum similarity for company matches
}

/**
 * Default matching configuration
 * Total weight: 110 points (email: 50, name: 30, company: 15, location: 10, jobTitle: 5)
 */
export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  weights: {
    email: 50,
    name: 30,
    company: 15,
    location: 10,
    jobTitle: 5,
  },
  algorithm: 'jaro-winkler', // Better for short strings like names
  nameThreshold: 0.7,
  companyThreshold: 0.6,
};

/**
 * Create a custom matching configuration
 */
export function createMatchingConfig(
  partial?: Partial<MatchingConfig>
): MatchingConfig {
  return {
    ...DEFAULT_MATCHING_CONFIG,
    ...partial,
    weights: {
      ...DEFAULT_MATCHING_CONFIG.weights,
      ...partial?.weights,
    },
  };
}
