import {
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenAssociateTransaction,
  TransferTransaction,
  Hbar,
  AccountBalanceQuery,
} from '@hashgraph/sdk';
import { HEDERA_CONFIG } from './hedera-config';

let client: Client | null = null;

export const getHederaClient = (): Client => {
  if (client) return client;

  try {
    if (HEDERA_CONFIG.isMainnet) {
      client = Client.forMainnet();
    } else {
      client = Client.forTestnet();
    }

    if (HEDERA_CONFIG.operatorId && HEDERA_CONFIG.operatorKey) {
      client.setOperator(
        AccountId.fromString(HEDERA_CONFIG.operatorId),
        PrivateKey.fromString(HEDERA_CONFIG.operatorKey)
      );
    }

    return client;
  } catch (error) {
    console.error('Error creating Hedera client:', error);
    throw error;
  }
};

export const createHENSToken = async () => {
  const client = getHederaClient();

  try {
    const operatorId = AccountId.fromString(HEDERA_CONFIG.operatorId);
    const operatorKey = PrivateKey.fromString(HEDERA_CONFIG.operatorKey);

    const tokenCreateTx = await new TokenCreateTransaction()
      .setTokenName('WaveUnits Hen Share Token')
      .setTokenSymbol('HENS')
      .setDecimals(2)
      .setInitialSupply(0)
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(TokenSupplyType.Infinite)
      .setTreasuryAccountId(operatorId)
      .setAdminKey(operatorKey)
      .setSupplyKey(operatorKey)
      .setFreezeKey(operatorKey)
      .setWipeKey(operatorKey)
      .freezeWith(client);

    const tokenCreateSign = await tokenCreateTx.sign(operatorKey);
    const tokenCreateSubmit = await tokenCreateSign.execute(client);
    const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
    const tokenId = tokenCreateReceipt.tokenId;

    console.log(`HENS Token created with ID: ${tokenId}`);
    return tokenId?.toString() || '';
  } catch (error) {
    console.error('Error creating HENS token:', error);
    throw error;
  }
};

export const associateTokenToAccount = async (
  accountId: string,
  tokenId: string
): Promise<boolean> => {
  try {
    const client = getHederaClient();

    const transaction = await new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountId))
      .setTokenIds([tokenId])
      .freezeWith(client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return receipt.status.toString() === 'SUCCESS';
  } catch (error) {
    console.error('Error associating token:', error);
    return false;
  }
};

export const transferHENSTokens = async (
  toAccountId: string,
  amount: number
): Promise<string | null> => {
  try {
    const client = getHederaClient();
    const operatorId = AccountId.fromString(HEDERA_CONFIG.operatorId);
    const tokenId = HEDERA_CONFIG.hensTokenId;

    if (!tokenId) {
      throw new Error('HENS token not configured');
    }

    const transaction = await new TransferTransaction()
      .addTokenTransfer(tokenId, operatorId, -amount * 100)
      .addTokenTransfer(tokenId, AccountId.fromString(toAccountId), amount * 100)
      .freezeWith(client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    if (receipt.status.toString() === 'SUCCESS') {
      return txResponse.transactionId.toString();
    }

    return null;
  } catch (error) {
    console.error('Error transferring HENS tokens:', error);
    return null;
  }
};

export const getAccountBalance = async (accountId: string): Promise<number> => {
  try {
    const client = getHederaClient();

    const query = new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId));

    const balance = await query.execute(client);
    return balance.hbars.toBigNumber().toNumber();
  } catch (error) {
    console.error('Error getting account balance:', error);
    return 0;
  }
};

export const getTokenBalance = async (
  accountId: string,
  tokenId: string
): Promise<number> => {
  try {
    const client = getHederaClient();

    const query = new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId));

    const balance = await query.execute(client);
    const tokens = balance.tokens;

    if (tokens && tokens.get(tokenId)) {
      return tokens.get(tokenId)?.toNumber() || 0;
    }

    return 0;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
};

export const transferHBAR = async (
  toAccountId: string,
  amount: number
): Promise<string | null> => {
  try {
    const client = getHederaClient();
    const operatorId = AccountId.fromString(HEDERA_CONFIG.operatorId);

    const transaction = await new TransferTransaction()
      .addHbarTransfer(operatorId, new Hbar(-amount))
      .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(amount))
      .freezeWith(client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    if (receipt.status.toString() === 'SUCCESS') {
      return txResponse.transactionId.toString();
    }

    return null;
  } catch (error) {
    console.error('Error transferring HBAR:', error);
    return null;
  }
};
