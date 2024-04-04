const fs = require("fs");
const crypto = require("crypto");

// Function to validate a transaction
function validateTransaction(transaction) {
    // Validate the version (assuming version 1 is valid)
    if (transaction.version !== 1) {
        console.log("Invalid version");
        return false;
    }

    // Validate the locktime (assuming locktime 0 is valid)
    if (transaction.locktime !== 0) {
        console.log("Invalid locktime");
        return false;
    }

    // Validate each vin (input) of the transaction
    for (const vin of transaction.vin) {
        // Check if is_coinbase flag is set to true for any vin
        if (vin.is_coinbase) {
            console.log("Coinbase transaction not allowed");
            return false;
        }
    }

    // Validate each vout (output) of the transaction
    for (const vout of transaction.vout) {
        // Check if the value of each output is non-negative
        if (vout.value < 0) {
            console.log("Negative output value not allowed");
            return false;
        }
    }

    // If all validations pass, return true
    return true;
}

// Function to mine a block
function mineBlock(transactions) {
  const blockHeader = "Block Header Placeholder"; // Replace this with actual block header generation
  const coinbaseTransaction = "Coinbase Transaction Placeholder"; // Replace this with actual coinbase transaction serialization
  // Implement mining logic to find suitable nonce
  const nonce = findNonce(blockHeader, coinbaseTransaction, transactions);
  // Construct final block header with nonce
  const finalBlockHeader = `${blockHeader} - Nonce: ${nonce}`;
  // Extract transaction IDs
  const transactionIds = transactions.map((tx) => tx.txid);
  return { finalBlockHeader, coinbaseTransaction, transactionIds };
}

// Function to find a suitable nonce for mining
function findNonce(blockHeader, coinbaseTransaction, transactions) {
  // Implement mining logic here
  // For simplicity, let's assume nonce is just a random number
  return Math.floor(Math.random() * 1000000);
}

// Function to write output to file
function writeOutput(blockHeader, coinbaseTransaction, transactionIds) {
  const content = `${blockHeader}\n${coinbaseTransaction}\n${transactionIds.join(
    "\n"
  )}\n`;
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
  const { finalBlockHeader, coinbaseTransaction, transactionIds } =
    mineBlock(transactions);

  // Write output to file
  writeOutput(finalBlockHeader, coinbaseTransaction, transactionIds);
}

main();
