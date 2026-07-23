export interface RegisterConsumerPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
  consentAccepted: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}