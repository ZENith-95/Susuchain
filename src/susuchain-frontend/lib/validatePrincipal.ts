import { Principal } from '@dfinity/principal';

export const validatePrincipalId = (principalId: string): boolean => {
  try {
    Principal.fromText(principalId);
    return true;
  } catch {
    return false;
  }
};

export const sanitizePrincipalId = (principalId: string): string => {
  try {
    return Principal.fromText(principalId).toString();
  } catch {
    throw new Error(`Invalid Principal ID: ${principalId}`);
  }
};
