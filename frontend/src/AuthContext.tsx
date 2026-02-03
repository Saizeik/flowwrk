import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { authApi, User } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  oauthLogin: (token: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("app_token")
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi
        .getCurrentUser()
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem("app_token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
      setUser(null);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem("app_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const oauthLogin = async (jwtToken: string) => {
    // Store the JWT token from OAuth2 redirect
    localStorage.setItem("app_token", jwtToken);
    setToken(jwtToken);

    // Fetch user details using the token
    const response = await authApi.getCurrentUser();
    setUser(response.data);
  };

  const register = async (name: string, email: string, password: string) => {
    // Register returns only a message, no token yet
    await authApi.register({ name, email, password });
    // User will be redirected to verify email page
  };

  const logout = () => {
    localStorage.removeItem("app_token");
    setToken(null);
    setUser(null);
  };

  const verifyEmail = async (emailToken: string) => {
    await authApi.verifyEmail(emailToken);
    // Email verified, user can now login
  };

  const refreshUser = async () => {
    if (token) {
      const response = await authApi.getCurrentUser();
      setUser(response.data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        oauthLogin,
        register,
        verifyEmail,
        logout,
        refreshUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
