// utils/transactionSupport.js
/**
 * Utility to detect MongoDB transaction support and execute operations safely.
 * If the connected deployment is a replica set (or sharded cluster) MongoDB supports
 * multi‑document transactions. For a standalone server we fall back to a no‑op
 * transaction wrapper that simply runs the callback.
 */
const mongoose = require('mongoose');

/**
 * Checks whether the current MongoDB connection supports ACID transactions.
 * @returns {Promise<boolean>} true if transactions are supported.
 */
async function supportsTransactions() {
  try {
    // The admin command "isMaster" (or "hello") indicates replica set topology.
    const admin = mongoose.connection.db.admin();
    const info = await admin.command({ ismaster: 1 });
    // If the server reports a setName, it is part of a replica set.
    return !!info.setName;
  } catch (e) {
    console.warn('Could not determine transaction support, assuming none.', e.message);
    return false;
  }
}

/**
 * Executes the provided async function within a transaction if supported.
 * @param {function(session: mongoose.ClientSession): Promise<any>} fn
 * @returns {Promise<any>} result of fn
 */
async function withTransaction(fn) {
  const canTransact = await supportsTransactions();
  if (canTransact) {
    const session = await mongoose.startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  } else {
    // If transactions are not supported, execute the function without a session.
    // This ensures the webhook still processes, albeit without atomic guarantees.
    // The callback should handle a null/undefined session gracefully.
    return await fn(null);
  }
}

module.exports = { supportsTransactions, withTransaction };
