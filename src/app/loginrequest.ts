export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/** PUT /api/user/update: solo i campi cambiati; currentPassword serve per email e password */
export interface ProfileUpdate {
  username?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
  profileImage?: string;
}
