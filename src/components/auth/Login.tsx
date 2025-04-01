import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginAttempt } from '../../store/slices/authSlice';
import { useAppSelector, useAppDispatch } from '../../store';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';

/**
 * Login component that dispatches the login command to the backend
 * Uses Redux for state management and follows declarative UI principles
 */
const Login: React.FC = () => {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  
  // Redux with typed selector and dispatch
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector(state => state.auth);
  
  // Navigation
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Handle login attempt
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!email || !password) return;
    
    // Dispatch login action to Redux
    dispatch(loginAttempt({ email, password, role }));
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Helpdesk Login</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>
        
        <form onSubmit={handleLogin}>
          {/* Email input */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          {/* Password input */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {/* Role selector */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mb-4 flex items-center rounded-md bg-red-50 p-3 text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Submit button */}
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
