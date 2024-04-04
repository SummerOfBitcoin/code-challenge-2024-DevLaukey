const fs = require("fs");
const crypto = require("crypto");

const DIFFICULTY_TARGET =
  "0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// Function to calculate the hash of a block
function calculateBlockHash(blockHeader) {
  return crypto.createHash("sha256").update(blockHeader).digest("hex");
}

// Function to mine a block
function mineBlock(transactions) {
  let blockHeader = "Block Header Placeholder"; // Replace this with actual block header generation

  // Iterate nonce until a suitable block hash is found
  let nonce = 0;
  let blockHash = calculateBlockHash(blockHeader + nonce);
  while (blockHash >= DIFFICULTY_TARGET) {
    nonce++;
    blockHash = calculateBlockHash(blockHeader + nonce);
  }

  // Construct final block header with nonce
  const finalBlockHeader = `${blockHeader} - Nonce: ${nonce}`;

  // Extract transaction IDs
  const transactionIds = transactions.map((tx) => tx.txid);

  return { finalBlockHeader, transactionIds };
}

// Function to write output to file
function writeOutput(blockHeader, transactionIds) {
  const content = `${blockHeader}\n${transactionIds.join("\n")}\n`;
  fs.writeFileSync("output.txt", content);
}

// Main function
function main() {
  const mempoolPath = "./mempool";
  const transactions = [];

  // Read files from the mempool folder
  const files = fs.readdirSync(mempoolPath);

  // Iterate through each file
  files.forEach((file) => {
    // Read the JSON file
    const fileContent = fs.readFileSync(`${mempoolPath}/${file}`, "utf8");
    // Parse the JSON content
    const transaction = JSON.parse(fileContent);
    // Validate the transaction
    if (validateTransaction(transaction)) {
      transactions.push(transaction);
    } else {
      console.log(`Invalid transaction found: ${transaction.txid}`);
    }
  });

  // Mine the block
  const { finalBlockHeader, transactionIds } = mineBlock(transactions);

  // Write output to file
  writeOutput(finalBlockHeader, transactionIds);
}

main();
