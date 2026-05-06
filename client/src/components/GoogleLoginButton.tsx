import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../store/AuthContext';

const GoogleLoginButton: React.FC = () => {
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      await login(credentialResponse.credential);
    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
  };

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
        theme="outline"
        shape="pill"
      />
    </div>
  );
};

export default GoogleLoginButton;
