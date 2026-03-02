import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../lib/api.js';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      setAuthToken(getToken);
      api
        .get('/users/me')
        .then((res) => setUser(res.data.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [isSignedIn, isLoaded, getToken]);

  return (
    <UserContext.Provider value={{ user, loading, refetchUser: () => {
      api.get('/users/me').then((res) => setUser(res.data.data)).catch(() => {});
    }}}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
