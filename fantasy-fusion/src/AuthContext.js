// AuthContext.js

import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (username, password) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

        // Inside your login function
        const data = await response.json();
        console.log('Login response data:', data);
        if (response.ok && data.access_token) { // Make sure to check for the correct token key
          localStorage.setItem('authToken', data.access_token); // Store the token
          setUser(data.user_info); // Set user info if needed
      } else {
            console.error('Login failed or token missing:', data);
        }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const fetchUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('No auth token available.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/user-info', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
      } else {
        throw new Error(data.error || 'Failed to fetch user data');
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
