export type TRefreshTokenPayload = {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
};

export type TGoogleUserProfile = {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
};

export type TGoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
};

export type TApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};
