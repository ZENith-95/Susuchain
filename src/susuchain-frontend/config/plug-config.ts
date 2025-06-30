import { Principal } from '@dfinity/principal';

export const PLUG_HOST = process.env.NEXT_PUBLIC_DFX_FRONTEND_HOST || 'http://localhost:4943';

export const PLUG_WHITELIST = [
  process.env.NEXT_PUBLIC_SUSUCHAIN_CANISTER_ID || 'umunu-kh777-77774-qaaca-cai',
  process.env.NEXT_PUBLIC_TOKEN_CANISTER_ID || 'bd3sg-teaaa-aaaaa-qaaba-cai',
];

export const createPlugConfig = () => ({
  whitelist: PLUG_WHITELIST,
  host: PLUG_HOST,
});

export const validatePrincipalId = (principalId: string): string => {
  try {
    return Principal.fromText(principalId).toString();
  } catch (error) {
    console.error('Invalid Principal ID:', error);
    throw error;
  }
};
