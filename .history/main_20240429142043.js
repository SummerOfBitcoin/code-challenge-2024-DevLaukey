const fs = require("fs");
const path = require("path");
const { generateMerkleRoot } = require("./utils");
const { createHash } = require("crypto");
const { validateBlock } = require("./validateBlock");
const { validateHeader } = require("./validateHeader");

const mempoolDir = "./mempool";
const difficultyTarget = Buffer.from(
  "0000ffff00000000000000000000000000000000000000000000000000000000",
  "hex"
);

// Function to read and parse transactions from the mempool folder
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

// Function to validate a transaction
const validateTransaction = (transaction) => {
  // Your validation logic here
  // Example: Check if transaction is digitally signed, inputs and outputs are valid, etc.
  return true; // Placeholder, replace with actual logic
};

// Function to mine a block
const mineBlock = (header) => {
  let nonce = 0;
  let hash = "";

  while (true) {
    const headerWithNonce = header + nonce.toString(16).padStart(8, "0"); // Concatenate header with nonce
    const headerBuffer = Buffer.from(headerWithNonce, "hex");
    const hashBuffer = createHash("sha256").update(headerBuffer).digest();
    hash = createHash("sha256")
      .update(hashBuffer)
      .digest()
      .reverse()
      .toString("hex");

    if (Buffer.from(hash, "hex").compare(difficultyTarget) < 0) {
      break; // Exit loop if hash is less than the difficulty target
    }

    nonce++; // Increment nonce for next iteration
  }

  return { hash, nonce };
};

// Main script
try {
  // Step 1: Read and Parse the Transactions
  const transactions = readTransactions();

  // Filter out invalid transactions
  const validTransactions = transactions.filter((transaction) =>
    validateTransaction(transaction)
  );

  // Extract coinbase transaction and block header from data
  const coinbase = validTransactions.find(
    (transaction) => transaction.is_coinbase
  ).vin[0];
  const header = validTransactions.find(
    (transaction) => !transaction.is_coinbase
  ).vin[0].txid; // Assuming the first non-coinbase transaction's vin is the header

  // Extract txids
  const txids = validTransactions.map((transaction) => transaction.txid);

  // Validate block
  validateBlock(coinbase, txids, validTransactions);

  // Mine the block
  const { hash, nonce } = mineBlock(header);

  // Validate block header
  validateHeader(header + nonce.toString(16).padStart(8, "0"), txids);

  // Construct output.txt
  const output = `${hash}\n${JSON.stringify(coinbase)}\n${txids.join("\n")}`;
  fs.writeFileSync("output.txt", output);

  console.log("Output file generated successfully!");
} catch (error) {
  console.error("Error:", error.message);
}
