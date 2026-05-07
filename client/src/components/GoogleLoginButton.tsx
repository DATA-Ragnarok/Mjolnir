import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';

const GoogleLoginButton: React.FC = () => {
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
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
