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
  // Validate vin and vout
  const vinValid = transaction.vin.every((input) =>
    parentTxids.has(input.txid)
  );
  const voutValid = transaction.vout.every((output) => output.value > 0);

  return vinValid && voutValid;
};

const validateTransactions = (transactions) => {
  const validTransactions = [];
  const parentTxids = new Set();

  transactions.forEach((transaction) => {
    if (validateTransaction(transaction, parentTxids)) {
      validTransactions.push(transaction);
      transaction.vin.forEach((input) => parentTxids.add(input.txid));
    }
  });

  return validTransactions;
};

// Step 3: Create the Coinbase Transaction
const createCoinbaseTransaction = (validTransactions) => {
  // Calculate total fee
  const totalFee = validTransactions.reduce(
    (acc, curr) =>
      acc +
      (curr.vout[0].value + curr.vout[1].value - curr.vin[0].prevout.value),
    0
  );

  // Create coinbase transaction
  const coinbaseTx = {
    txid: "coinbaseTxId",
    fee: totalFee,
    // Assumption: For simplicity, using a hardcoded 'coinbaseTxId' as the coinbase transaction ID
  };

  return coinbaseTx;
};

// Step 4: Construct the Block Header
const constructBlockHeader = (merkleRoot) => {
  const version = 1;
  const prevBlockHash =
    "0000000000000000000000000000000000000000000000000000000000000000";
  const timestamp = Math.floor(Date.now() / 1000);
  const bits = "0000ffff";
  let nonce = 0;

  const blockHeader = {
    version,
    prevBlockHash,
    merkleRoot,
    timestamp,
    bits,
    nonce,
    // Assumption: nonce starts from 0 and will be incremented during mining
  };

  return blockHeader;
};

// Step 5: Mine the Block
const mineBlock = (blockHeader, coinbaseTx, transactions) => {
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
    // Assumption: Mining process increments the nonce value to find a valid block hash
  }

  return { blockHash, nonce };
};

const isValidHash = (hash) => {
  const target =
    "0000ffff00000000000000000000000000000000000000000000000000000000";
  return hash < target;
};

// Step 6: Generate the Output File
const writeOutputFile = (blockHeader, coinbaseTx, minedTxids) => {
  const outputFileContent = `${JSON.stringify(blockHeader)}\n${JSON.stringify(
    coinbaseTx
  )}\n${minedTxids.join("\n")}`;
  fs.writeFileSync("output.txt", outputFileContent);
};

// Step 7: Calculate Merkle Root
const calculateMerkleRoot = (transactions) => {
  const txids = transactions.map((tx) => tx.txid);
  let merkleRoot = crypto
    .createHash("sha256")
    .update(txids.join(""))
    .digest("hex");
  // Assumption: Simplified Merkle Root calculation by hashing concatenated transaction IDs

  return merkleRoot;
};

// Main Execution
const main = () => {
  const transactions = readTransactions();
  console.log(`Total Transactions: ${transactions.length}`, transactions)
  const validTransactions = validateTransactions(transactions);
  console.log("Valid Transactions: ", validTransactions)
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
