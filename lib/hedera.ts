export interface WalletConnection {
  accountId: string;
  balance: number;
}

export const connectWallet = async (): Promise<WalletConnection | null> => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    const demoAccountId = `0.0.${Math.floor(Math.random() * 1000000)}`;

    return {
      accountId: demoAccountId,
      balance: 0,
    };
  } catch (error) {
    console.error('Hedera wallet connection error:', error);
    return null;
  }
};

export const getAccountBalance = async (accountId: string): Promise<number> => {
  return 0;
};

export const sendHBARTransaction = async (
  toAccountId: string,
  amount: number
): Promise<string | null> => {
  try {
    return `0.0.${Date.now()}`;
  } catch (error) {
    console.error('Transaction error:', error);
    return null;
  }
};
