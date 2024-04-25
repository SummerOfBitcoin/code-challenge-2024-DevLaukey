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

// Step 2: Validate the Transactions
const validateTransaction = (transaction, parentTxids) => {
  // Implement validation logic here
  // For example:
  // Check if all parent transactions are in parentTxids
  return true;
};

const validateTransactions = (transactions) => {
  const validTransactions = [];
  const parentTxids = new Set();

  transactions.forEach((transaction) => {
    if (validateTransaction(transaction, parentTxids)) {
      validTransactions.push(transaction);
      transaction.parents.forEach((parentTxid) => parentTxids.add(parentTxid));
    }
  });

  return validTransactions;
};

// Step 3: Create the Coinbase Transaction
const createCoinbaseTransaction = (validTransactions) => {
  // Implement coinbase transaction creation logic here
  // For example:
  const totalFee = validTransactions.reduce((acc, curr) => acc + curr.fee, 0);
  const coinbaseTx = {
    txid: "coinbaseTxId",
    fee: totalFee,
    // other fields
  };

  return coinbaseTx;
};

// Step 4: Construct the Block Header
const constructBlockHeader = (merkleRoot) => {
  // Implement block header construction logic here
  // For example:
  const blockHeader = {
    // fields
  };

  return blockHeader;
};

// Step 5: Mine the Block
const mineBlock = (blockHeader, coinbaseTx, transactions) => {
  // Implement block mining logic here
  // For example:
  let nonce = 0;
  let blockHash = "";

  while (!isValidHash(blockHash)) {
    const data = JSON.stringify({
      blockHeader,
      coinbaseTx,
      transactions,
      nonce,
    });

    blockHash = crypto.createHash("sha256").update(data).digest("hex");
    nonce++;
  }

  return blockHash;
};

const isValidHash = (hash) => {
  const target =
    "0000ffff00000000000000000000000000000000000000000000000000000000";
  return hash < target;
};

// Step 6: Generate the Output File
const writeOutputFile = (blockHeader, coinbaseTx, minedTxids) => {
  // Implement output file writing logic here
  // For example:
  const outputFileContent = `${JSON.stringify(blockHeader)}\n${JSON.stringify(
    coinbaseTx
  )}\n${minedTxids.join("\n")}`;
  fs.writeFileSync("output.txt", outputFileContent);
};

// Main Execution
const main = () => {
    const transactions = readTransactions();
    console.log(transactions,"transactions")
//   const validTransactions = validateTransactions(transactions);
//   const coinbaseTx = createCoinbaseTransaction(validTransactions);
//   const merkleRoot = "calculateMerkleRoot(validTransactions)";
//   const blockHeader = constructBlockHeader(merkleRoot);
//   const minedTxids = mineBlock(blockHeader, coinbaseTx, validTransactions);

//   writeOutputFile(blockHeader, coinbaseTx, minedTxids);
};

// Execute main function
main();
