import React, { useState } from 'react';
import { configuredAuthTransition } from '../shell/config/auth.config';

interface AuthExampleProps {
  onAuthSuccess?: (event: any) => void;
  onAuthFailure?: (event: any) => void;
}

/**
 * Example component that demonstrates the use of the event-sourced authentication provider
 */
const AuthExample: React.FC<AuthExampleProps> = ({ onAuthSuccess, onAuthFailure }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Create the authentication command
    const command = { email, password };

    // Use the configured authentication transition function
    configuredAuthTransition(command)
      .then(event => {
        setResult({ success: true, event });
        setLoading(false);
        if (onAuthSuccess) onAuthSuccess(event);
      })
      .catch(event => {
        setResult({ success: false, event });
        setLoading(false);
        if (onAuthFailure) onAuthFailure(event);
      });
  };

  return (
    <div className="auth-example p-4 border rounded shadow-sm">
      <h2 className="text-xl font-bold mb-4">Event-Sourced Authentication</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? 'Authenticating...' : 'Login'}
        </button>
      </form>
      
      {result && (
        <div className="mt-4 p-3 rounded border" style={{ backgroundColor: result.success ? '#f0fff4' : '#fff5f5' }}>
          <h3 className="font-bold">{result.success ? 'Authentication Successful' : 'Authentication Failed'}</h3>
          <pre className="mt-2 text-xs overflow-auto max-h-40">
            {JSON.stringify(result.event, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>This component demonstrates the Event Sourcing pattern:</p>
        <ol className="list-decimal pl-5 mt-1 space-y-1">
          <li>User intent is captured as a command</li>
          <li>Command is processed by a pure transition function</li>
          <li>Result is an event that is stored in Supabase</li>
          <li>UI reacts to the event</li>
        </ol>
      </div>
    </div>
  );
};

export default AuthExample;
