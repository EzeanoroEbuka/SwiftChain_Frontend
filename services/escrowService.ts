import {
  Server,
  TransactionBuilder,
  Operation,
  Networks,
  xdr,
  scValToNative,
} from 'stellar-sdk';
import { getWallet } from '@/lib/wallet'; // Assume a utility to get a connected wallet instance
import type { EscrowDetails, ReleaseFundsResponse } from '@/types/escrow';

const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL!;
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || Networks.TESTNET;

const server = new Server(SOROBAN_RPC_URL, { allowHttp: true });

/**
 * Fetches the current state of an escrow contract.
 * @param escrowId The contract address.
 */
async function getEscrowDetails(escrowId: string): Promise<EscrowDetails> {
  try {
    // These keys depend on your contract's storage implementation.
    // They are the base64-encoded ScVal representations of your storage keys.
    const signaturesKey = xdr.ScVal.fromXDR('AAAABgAAAAtzaWduYXR1cmVz', 'base64');
    const thresholdKey = xdr.ScVal.fromXDR('AAAABgAAAAl0aHJlc2hvbGQ=', 'base64');
    const releasedKey = xdr.ScVal.fromXDR('AAAABgAAAAlyZWxlYXNlZA==', 'base64');

    const [signaturesEntry, thresholdEntry, releasedEntry] = await Promise.all([
      server.getContractData(escrowId, signaturesKey).catch(() => null),
      server.getContractData(escrowId, thresholdKey).catch(() => null),
      server.getContractData(escrowId, releasedKey).catch(() => null),
    ]);

    // scValToNative converts the contract's XDR response to native JS types.
    const signers: string[] = signaturesEntry
      ? (scValToNative(signaturesEntry.val) as string[])
      : [];
    const requiredSignatures = thresholdEntry
      ? scValToNative(thresholdEntry.val)
      : 0;
    const isReleased = releasedEntry ? scValToNative(releasedEntry.val) : false;

    return { currentSignatures: signers.length, requiredSignatures, isReleased, signers };
  } catch (error) {
    console.error('Error fetching escrow details:', error);
    throw new Error('Failed to fetch escrow contract details from the network.');
  }
}

/**
 * Invokes the 'release_funds' function on the escrow contract.
 * @param escrowId The contract address.
 */
async function releaseFunds(escrowId: string): Promise<ReleaseFundsResponse> {
  const wallet = getWallet(); // Assumes a connected wallet (e.g., Freighter)
  const publicKey = await wallet.getPublicKey();

  if (!publicKey) {
    throw new Error('Wallet not connected or public key unavailable.');
  }

  const sourceAccount = await server.getAccount(publicKey);
  const tx = new TransactionBuilder(sourceAccount, {
    fee: '100000', // Example fee
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContract({
        contract: escrowId,
        function: 'release_funds', // Name of the contract function
        args: [], // No arguments needed for this example
      }),
    )
    .setTimeout(30)
    .build();

  const signedTx = await wallet.signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  const transaction = TransactionBuilder.fromXDR(signedTx, NETWORK_PASSPHRASE);

  const sendTransactionResponse = await server.sendTransaction(transaction);

  // Poll for transaction completion
  let getTransactionResponse = await server.getTransaction(
    sendTransactionResponse.hash,
  );
  while (getTransactionResponse.status === 'NOT_FOUND') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getTransactionResponse = await server.getTransaction(
      sendTransactionResponse.hash,
    );
  }

  if (getTransactionResponse.status === 'SUCCESS') {
    return { success: true, transactionHash: getTransactionResponse.id };
  } else {
    console.error('Transaction failed:', getTransactionResponse);
    throw new Error('Transaction failed or timed out.');
  }
}

export const escrowService = {
  getEscrowDetails,
  releaseFunds,
};