/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Saree {
  id: string;
  weaverName: string;
  weaverAge: number;
  weaverBio: string;
  village: string;
  cooperative: string;
  material: string;
  daysOfLabor: number;
  price: number;
  patternType: string;
  registeredDate: string;
  referencePhoto: string; // base64 or SVG
}

export interface VerificationResult {
  isMatch: boolean;
  matchScore: number;
  reasoning: string;
  detailedAnalysis: {
    weaveStructure: string;
    threadTension: string;
    patternAlignment: string;
  };
  recommendation: string;
}
