const fs = require("fs");
const crypto = require("crypto");
const { Transaction, script } = require("bitcoinjs-lib");
const {
  generateMerkleRoot,
  hash256,
  WITNESS_RESERVED_VALUE,
} = require("./utils");
const { validateBlock } = require("./validate-block");
const { validateHeader } = require("./validate-header");

const DIFFICULTY_TARGET = Buffer.from(
  "0000ffff00000000000000000000000000000000000000000000000000000000",
  "hex"
);
const BLOCK_REWARD = 50 * 100000000; // 50 BTC in satoshis

// Parse and validate transactions from mempool
const mempool = fs
  .readdirSync("./mempool")
  .filter((file) => file.endsWith(".json"));
const validTxids = [];
const validTxs = [];

for (const file of mempool) {
  const txData = JSON.parse(fs.readFileSync(`./mempool/${file}`));
  const tx = Transaction.fromHex(txData.hex);

  try {
    tx.validate(validTxs.map((tx) => tx.getHash()));
    validTxids.push(tx.getId());
    validTxs.push(tx);
  } catch (err) {
    console.log(`Invalid transaction: ${file} - ${err.message}`);
  }
}

// Create coinbase transaction
const coinbaseScript = script.compile([
  script.opcodes.OP_RETURN,
  Buffer.from("Add your coinbase message here", "utf8"),
]);

const coinbaseTx = new Transaction();
coinbaseTx.addInput(new Transaction.Input.NULL_SCRIPT(), 0xffffffff);
coinbaseTx.addOutput(Transaction.Output.fromValue(BLOCK_REWARD), BLOCK_REWARD);

const wtxids = [coinbaseTx.getHash(true).reverse().toString("hex")];
validTxids.forEach((txid) =>
  wtxids.push(Buffer.from(txid, "hex").reverse().toString("hex"))
);

const witnessCommitment = hash256(
  generateMerkleRoot(wtxids) + WITNESS_RESERVED_VALUE.toString("hex")
);
const witnessCommitmentScript = script.compile([
  script.opcodes.OP_RETURN,
  Buffer.from(witnessCommitment, "hex"),
]);

coinbaseTx.addOutput(
  Transaction.Output.fromValues(script.execute(witnessCommitmentScript), 0)
);
const coinbaseHex = coinbaseTx.toHex();

// Mine the block
let nonce = 0;
let blockHeader;

while (true) {
  const merkleRoot = generateMerkleRoot(validTxids);
  const time = Math.floor(Date.now() / 1000);
  const blockHeaderBuffer = Buffer.alloc(80);

  blockHeaderBuffer.writeUInt32LE(1, 0); // Version
  Buffer.from(
    process.env.PREV_BLOCK_HASH ||
      "0000000000000000000000000000000000000000000000000000000000000000",
    "hex"
  ).copy(blockHeaderBuffer, 4);
  Buffer.from(merkleRoot, "hex").copy(blockHeaderBuffer, 36);
  blockHeaderBuffer.writeUInt32LE(time, 68);
  blockHeaderBuffer.writeUInt32LE(0x1f00ffff, 72); // Bits (difficulty target)
  blockHeaderBuffer.writeUInt32LE(nonce, 76);

  blockHeader = blockHeaderBuffer.toString("hex");

  const blockHash = Buffer.from(hash256(blockHeader), "hex").reverse();

  if (blockHash.compare(DIFFICULTY_TARGET) <= 0) {
    break;
  }

  nonce++;
}

// Validate the block
try {
  validateHeader(blockHeader, validTxids);
  validateBlock(coinbaseHex, validTxids);
} catch (err) {
  console.error("Block validation failed:", err.message);
  process.exit(1);
}

// Write output.txt
const output = `${blockHeader}\n${coinbaseHex}\n${validTxids.join("\n")}`;
fs.writeFileSync("output.txt", output);

console.log("Block successfully mined and output.txt generated.");
