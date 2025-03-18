
import React from 'react';
import LoginForm from '@/components/auth/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full helpdesk-gradient flex items-center justify-center">
              <span className="text-white text-xl font-bold">HD</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold">Helpdesk Portal</h1>
          <p className="text-muted-foreground">
            Sign in to access your support tickets and resources
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
