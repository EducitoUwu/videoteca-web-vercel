export interface LoginResponse {
  data: {
    user: { email: string };
    accesToken: string;
    refreshToken: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}
