import React from 'react';
import GoogleLoginButton from '../components/GoogleLoginButton';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h1 className="text-center text-4xl font-extrabold text-indigo-600 mb-2">🔨 Mjolnir</h1>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Project management with divine precision
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <GoogleLoginButton />
          <div className="text-center">
            <p className="text-xs text-gray-500 mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
