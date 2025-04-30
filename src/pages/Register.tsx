import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full helpdesk-gradient flex items-center justify-center">
              <span className="text-white text-xl font-bold">HD</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold">Helpdesk Registration</h1>
          <p className="text-muted-foreground">
            Register to access the Advancio support portal
          </p>
        </div>
        
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
