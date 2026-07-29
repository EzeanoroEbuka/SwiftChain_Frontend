export interface CtaPayload {
  email: string;
}

export interface CtaResponse {
  message: string;
  success: boolean;
}

export interface CtaError {
  message: string;
  status?: number;
export interface CtaRegistrationPayload {
  email: string;
}

export interface CtaRegistrationResponse {
  success: boolean;
  message: string;
}
