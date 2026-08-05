/**
 * freighterService — wraps all Freighter browser extension calls.
 * Never called by components directly. Follows the Hook → Service pattern.
 *
 * Handles both freighter-api v1 (returns plain values) and
 * v2+ (returns { isConnected: boolean }) response shapes.
 */

export interface FreighterConnectResult {
  publicKey: string;
}

type FreighterIsConnectedResult = boolean | { isConnected: boolean };

interface FreighterAPI {
  isConnected: () => Promise<FreighterIsConnectedResult>;
  getPublicKey: () => Promise<string>;
  isAllowed: () => Promise<boolean>;
  setAllowed: () => Promise<boolean>;
  signTransaction: (transactionEnvelope: string) => Promise<string>;
}

function getFreighter(): FreighterAPI | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { freighter?: FreighterAPI };
  return w.freighter ?? null;
}

function parseIsConnected(result: FreighterIsConnectedResult): boolean {
  if (typeof result === 'object' && result !== null && 'isConnected' in result) {
    return result.isConnected;
  }
  return Boolean(result);
}

export const freighterService = {
  /**
   * Returns true when the Freighter extension is present in the browser.
   * SSR-safe — always returns false on the server.
   */
  isInstalled(): boolean {
    return getFreighter() !== null;
  },

  /**
   * Checks whether the current site has already been granted wallet access.
   */
  async isAllowed(): Promise<boolean> {
    const freighter = getFreighter();
    if (!freighter) return false;
    try {
      return await freighter.isAllowed();
    } catch {
      return false;
    }
  },

  /**
   * Triggers the Freighter permission prompt.
   */
  async requestAccess(): Promise<void> {
    const freighter = getFreighter();
    if (!freighter) throw new Error('Freighter is not installed');
    await freighter.setAllowed();
  },

  /**
   * Returns true when Freighter reports an active connection.
   */
  async isConnected(): Promise<boolean> {
    const freighter = getFreighter();
    if (!freighter) return false;
    try {
      const result = await freighter.isConnected();
      return parseIsConnected(result);
    } catch {
      return false;
    }
  },

  /**
   * Retrieves the user's Stellar public key from Freighter.
   * Requests access first if the site has not been allowed yet.
   */
  async getPublicKey(): Promise<string> {
    const freighter = getFreighter();
    if (!freighter) throw new Error('Freighter is not installed');

    const allowed = await this.isAllowed();
    if (!allowed) {
      await this.requestAccess();
    }

    const publicKey = await freighter.getPublicKey();
    if (!publicKey) throw new Error('Freighter did not return a public key');
    return publicKey;
  },

  /**
   * Signs a Stellar transaction envelope using Freighter.
   * Prompts the user to approve the signature in the wallet extension.
   */
  async signTransaction(transactionEnvelope: string): Promise<string> {
    const freighter = getFreighter();
    if (!freighter) throw new Error('Freighter is not installed');

    const allowed = await this.isAllowed();
    if (!allowed) {
      await this.requestAccess();
    }

    const signature = await freighter.signTransaction(transactionEnvelope);
    if (!signature) throw new Error('Freighter failed to sign the transaction');
    return signature;
  },
};
