export const mockWalletConnectResponse = {
  success: true,
  message: 'Connected',
  publicKey: 'GABC123DEF456STELLAR',
} as const;

export const mockWalletConnectFailureResponse = {
  success: false,
  message: 'Invalid public key',
  publicKey: '',
} as const;

export const mockWalletDisconnectResponse = {
  success: true,
  message: 'Disconnected',
} as const;
