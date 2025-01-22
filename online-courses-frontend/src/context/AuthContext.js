import { createContext } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  userRole: null,
  login: () => {},
  logout: () => {},
});

export default AuthContext;

