import {
  Client,
  AccountId,
  PrivateKey,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  Hbar,
} from '@hashgraph/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!);

const client = process.env.NEXT_PUBLIC_IS_MAINNET === 'true'
  ? Client.forMainnet()
  : Client.forTestnet();

client.setOperator(operatorId, operatorKey);

async function deployContract() {
  try {
    console.log('🚀 Starting WaveUnits Contract Deployment...\n');

    const contractBytecodePath = path.resolve(
      __dirname,
      '../contracts/WaveUnitsInvestment_bytecode.bin'
    );

    if (!fs.existsSync(contractBytecodePath)) {
      console.error('❌ Contract bytecode not found!');
      console.log('Please compile the contract first using:');
      console.log('solc --bin contracts/WaveUnitsInvestment.sol -o contracts/');
      return;
    }

    const contractBytecode = fs.readFileSync(contractBytecodePath);

    console.log('📤 Uploading contract bytecode to Hedera...');
    const fileCreateTx = new FileCreateTransaction()
      .setKeys([operatorKey])
      .setContents(contractBytecode.slice(0, 4096))
      .freezeWith(client);

    const fileCreateSign = await fileCreateTx.sign(operatorKey);
    const fileCreateSubmit = await fileCreateSign.execute(client);
    const fileCreateReceipt = await fileCreateSubmit.getReceipt(client);
    const bytecodeFileId = fileCreateReceipt.fileId;

    console.log(`✅ Bytecode file created: ${bytecodeFileId}`);

    if (contractBytecode.length > 4096) {
      console.log('📤 Appending remaining bytecode...');
      const fileAppendTx = new FileAppendTransaction()
        .setFileId(bytecodeFileId!)
        .setContents(contractBytecode.slice(4096))
        .freezeWith(client);

      const fileAppendSign = await fileAppendTx.sign(operatorKey);
      const fileAppendSubmit = await fileAppendSign.execute(client);
      await fileAppendSubmit.getReceipt(client);
      console.log('✅ Bytecode append complete');
    }

    console.log('\n📝 Deploying contract...');

    const treasuryAccount = process.env.NEXT_PUBLIC_PLATFORM_TREASURY_ACCOUNT || operatorId.toString();
    const hensTokenId = process.env.NEXT_PUBLIC_HENS_TOKEN_ID || '0.0.0';

    const contractInstantiateTx = new ContractCreateTransaction()
      .setBytecodeFileId(bytecodeFileId!)
      .setGas(300000)
      .setConstructorParameters(
        new ContractFunctionParameters()
          .addAddress(hensTokenId)
          .addAddress(treasuryAccount)
      )
      .setInitialBalance(new Hbar(10));

    const contractInstantiateSubmit = await contractInstantiateTx.execute(client);
    const contractInstantiateReceipt = await contractInstantiateSubmit.getReceipt(client);
    const contractId = contractInstantiateReceipt.contractId;

    console.log(`\n✅ Contract deployed successfully!`);
    console.log(`📋 Contract ID: ${contractId}`);
    console.log(`\n🔧 Update your .env file with:`);
    console.log(`NEXT_PUBLIC_INVESTMENT_CONTRACT_ID=${contractId}`);

    return contractId;
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

async function main() {
  try {
    const contractId = await deployContract();
    console.log('\n✅ Deployment complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
