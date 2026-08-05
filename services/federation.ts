export type FederationResult = {
  stellar_address: string;
  account_id: string;
};

export async function resolveFederationAddress(address: string): Promise<FederationResult> {
  const res = await fetch(`/api/federation/resolve?address=${encodeURIComponent(address)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to resolve federation address: ${address}`);
  }
  return res.json();
}
