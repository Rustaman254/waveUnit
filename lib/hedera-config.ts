export const HEDERA_CONFIG = {
  network: process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet',
  isMainnet: process.env.NEXT_PUBLIC_IS_MAINNET === 'true',
  operatorId: process.env.HEDERA_OPERATOR_ID || '',
  operatorKey: process.env.HEDERA_OPERATOR_KEY || '',
  treasuryAccount: process.env.NEXT_PUBLIC_PLATFORM_TREASURY_ACCOUNT || '',
  hensTokenId: process.env.NEXT_PUBLIC_HENS_TOKEN_ID || '',
  investmentContractId: process.env.NEXT_PUBLIC_INVESTMENT_CONTRACT_ID || '',
};

export const getNetworkNodes = () => {
  if (HEDERA_CONFIG.isMainnet) {
    return {
      '0.0.3': 'mainnet-public.mirrornode.hedera.com:443',
    };
  }
  return {
    '0.0.3': 'testnet.mirrornode.hedera.com:443',
  };
};
