const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const mempoolDir = "./mempool";

// Step 1: Read and Parse the Transactions
const readTransactions = () => {
  const files = fs.readdirSync(mempoolDir);
  const transactions = [];

  files.forEach((file) => {
    const filePath = path.join(mempoolDir, file);
    const data = fs.readFileSync(filePath, "utf-8");
    const transaction = JSON.parse(data);
    transactions.push(transaction);
  });

  return transactions;
};
// Step 2: Validate Block
const validateBlock = (block) => {
  // Validate block header
  const isBlockHeaderValid = validateBlockHeader(block.header);

  // Validate transactions
  const areTransactionsValid = validateTransactions(block.transactions);

  return isBlockHeaderValid && areTransactionsValid;
};

// Step 3: Validate Block Header
const validateBlockHeader = (blockHeader) => {
  // Check if version is valid
  if (blockHeader.version < 0) {
    return false;
  }

  // Check if timestamp is not too far in the future
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (blockHeader.timestamp > currentTimestamp + MAX_FUTURE_TIMESTAMP) {
    return false;
  }

  // Check if the hash of the block header meets the target difficulty
  if (!isValidHash(blockHeader.hash)) {
    return false;
  }

  // Additional checks can be added as needed

  return true; // For simplicity, assuming all block headers are valid
};

// Step 4: Validate Transactions
const validateTransactions = (transactions) => {
  // Validate each transaction
  const areAllTransactionsValid = transactions.every((transaction) => {
    return validateTransaction(transaction);
  });

  return areAllTransactionsValid;
};

// Step 5: Validate Transaction
const validateTransaction = (transaction) => {
  // Validate inputs
  const inputsValid = transaction.vin.every((input) => {
    // Check if the input is a coinbase transaction
    if (input.is_coinbase) {
      return true; // Coinbase transaction is always considered valid
    }

    // Check if the previous output is valid
    const prevOutput = input.prevout;
    if (!prevOutput || prevOutput.value < 0) {
      return false; // Invalid previous output
    }

    // Additional checks for script verification can be added here

    return true;
  });

  // Validate outputs
  const outputsValid = transaction.vout.every((output) => {
    return output.value >= 0; // Output value must be non-negative
  });

  // Additional checks related to consensus rules can be added here

  return inputsValid && outputsValid;
};

// Step 6: Helper Function - Check if Hash is Valid
const isValidHash = (hash) => {
  const target =
    "0000ffff00000000000000000000000000000000000000000000000000000000";
  return hash < target;
};

// Constants
const MAX_FUTURE_TIMESTAMP = 7200; // Maximum allowed future timestamp difference (in seconds)

// Main Execution
const main = () => {
  const transactions = readTransactions();
  const validTransactions = validateTransactions(transactions);

  console.log(`Valid Transactions: ${validTransactions.length}`);

  const coinbaseTx = createCoinbaseTransaction(validTransactions);
  const merkleRoot = calculateMerkleRoot(validTransactions);
  const blockHeader = constructBlockHeader(merkleRoot);
  const { blockHash, nonce } = mineBlock(
    blockHeader,
    coinbaseTx,
    validTransactions
  );

  console.log(`Block Hash: ${blockHash}`);
  console.log(`Nonce: ${nonce}`);

  writeOutputFile(
    blockHeader,
    coinbaseTx,
    validTransactions.map((tx) => tx.txid)
  );
};

// Execute main function
main();
