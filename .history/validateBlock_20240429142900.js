const { readFileSync } = require("fs");
const {
  generateMerkleRoot,
  hash256,
  WITNESS_RESERVED_VALUE,
} = require("./utils");

// Function to compute transaction hash without using bitcoinjs-lib
const getTransactionHash = (hex) => {
  return hash256(hex);
};

// Function to compute witness commitment without using bitcoinjs-lib
const calculateWitnessCommitment = (wtxids) => {
  const witnessRoot = generateMerkleRoot(wtxids);
  const witnessReservedValue = WITNESS_RESERVED_VALUE.toString("hex");
  return hash256(witnessRoot + witnessReservedValue);
};

// Function to validate the block
const validateBlock = (coinbaseHex, txids) => {
  if (txids.length === 1) {
    throw new Error(
      "Cannot validate empty block. You must include some transactions in the block to complete the challenge."
    );
  }

  // Load valid mempool data
  const mempool = JSON.parse(readFileSync("./mempool/valid-mempool.json"));
  const set = new Set(mempool);

  // Check if each transaction id is in the mempool
  for (let i = 1; i < txids.length; i++) {
    if (!set.has(txids[i])) {
      throw new Error("Invalid txid found in block");
    }
  }

  const coinbaseTx = coinbaseHex; // The coinbase transaction hex
  const coinbaseHash = getTransactionHash(coinbaseHex);
  if (coinbaseTx.substr(8, 2) !== "01") {
    throw new Error("Coinbase transaction has invalid input count");
  }
  // Assuming coinbase transaction has exactly 2 outputs
  if (coinbaseTx.substr(12, 2) !== "02") {
    throw new Error(
      "Coinbase transaction must have exactly 2 outputs. One for the block reward and one for the witness commitment"
    );
  }
  if (coinbaseTx.substr(16, 2) !== "00") {
    throw new Error("Coinbase transaction is not a coinbase");
  }
  const coinbaseScriptLength = parseInt(coinbaseTx.substr(18, 2), 16);
  if (coinbaseScriptLength < 2 || coinbaseScriptLength > 100) {
    throw new Error("Coinbase transaction input script length is invalid");
  }

  // Get witness commitment from the coinbase transaction
  const witnessCommitment = coinbaseTx.substr(
    20 + coinbaseScriptLength * 2,
    74
  );

  let totalWeight = BigInt(0);
  let totalFee = 0n;

  const wtxids = [coinbaseHash];

  for (let i = 1; i < txids.length; i++) {
    const tx = JSON.parse(
      readFileSync(`./mempool/valid-mempool/${txids[i]}.json`)
    );
    totalWeight += BigInt(tx.weight);
    totalFee += BigInt(tx.fee);
    const wtxid = getTransactionHash(tx.hex);
    wtxids.push(wtxid);
  }

  if (totalWeight > 4000000n) {
    throw new Error("Block exceeds maximum weight");
  }

  // Calculate witness commitment and check if it matches the one in the coinbase transaction
  const calculatedWitnessCommitment = calculateWitnessCommitment(wtxids);
  if (witnessCommitment !== calculatedWitnessCommitment) {
    throw new Error(
      "Coinbase transaction does not contain a valid witness commitment"
    );
  }

  console.log(
    `Congratulations! Block is valid with a total fee of ${totalFee} sats and a total weight of ${totalWeight}!`
  );
  return {
    fee: totalFee.toString(),
    weight: totalWeight.toString(),
  };
};

module.exports = {
  validateBlock,
};
