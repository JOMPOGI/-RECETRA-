import React, { createContext, useContext, useState, useEffect } from 'react';
import { findUserByCredentials, updateUser } from '../data/mockData';

/**
 * Authentication context type definition
 * Provides user state, loading state, and authentication methods
 * 
 * Context contains:
 * - user: User object or null (current logged-in user)
 * - isLoading: boolean (loading state during auth checks)
 * - login: function (username, password) => Promise<boolean>
 * - logout: function () => Promise<void>
 */

// Create the authentication context
const AuthContext = createContext(undefined);

/**
 * Custom hook to use authentication context
 * Throws error if used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * Manages user authentication state and provides auth methods to child components
 * Handles:
 * - User login/logout
 * - Session persistence using localStorage (web version)
 * - Loading states during authentication checks
 */
export const AuthProvider = ({ children }) => {
  // State for current user and loading status
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load user data from localStorage on app startup
   * This ensures the user stays logged in between browser sessions
   */
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  /**
   * Loads user data from localStorage on startup to keep session across refresh/redirect
   */
  const loadUserFromStorage = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Authenticates user with provided credentials
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Promise<boolean>} - True if login successful, false otherwise
   */
  const login = async (username, password) => {
    try {
      // First check mock data
      let foundUser = findUserByCredentials(username, password);
      
      // If not found in mock data, check localStorage for newly created users
      if (!foundUser) {
        const localUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
        foundUser = localUsers.find(user => 
          (user.username === username || user.email === username) && 
          user.password === password && 
          user.isActive
        );
      }
      
      if (foundUser) {
        // Set user state and save to localStorage
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  /**
   * Logs out the current user
   * Clears user state and removes from localStorage
   */
  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Updates the current user's profile information
   * @param {Object} updates - Object containing fields to update
   * @returns {Promise<boolean>} - True if update successful, false otherwise
   */
  const updateProfile = async (updates) => {
    try {
      if (!user || !user.id) return false;
      
      // Update user in mock data
      const updatedUser = updateUser(user.id, updates);
      if (!updatedUser) return false;
      
      // Update current user state
      const newUserData = { ...user, ...updates };
      setUser(newUserData);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(newUserData));
      
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  // Context value containing all auth-related state and methods
  const value = {
    user,
    isLoading,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};