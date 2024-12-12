import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import supabase from './SupabaseClient';

function LoginRegister() {
  const [session, setSession] = useState(null);

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Render logic
  return (
    session == null ? (<div className="flex justify-center items-center h-screen">
    <div className="flex flex-col items-center justify-center h-screen bg-[#242424] text-white px-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to Interview Assessor</h1>
      <div className="w-full max-w-md bg-[#1E1E1E] p-6 rounded-lg shadow-lg">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#4F46E5', // primary buttons
                  brandAccent: '#6366F1', // button hover
                  inputBackground: '#1E1E1E',
                  inputText: '#E5E7EB', 
                  inputBorder: '#374151',
                  labelText: '#9CA3AF',
                  buttonText: '#FFFFFF',
                  buttonBackground: '#4F46E5',
                  buttonBackgroundHover: '#6366F1',
                  socialButtonBackground: '#333333',
                  socialButtonBackgroundHover: '#444444',
                  socialButtonText: '#E5E7EB',
                },
              },
            },
          }}
          providers={[]}
        />
      </div>
    </div>


    </div>) : (
      <div>
        <p>Logged in!</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    )
  );
}

export default LoginRegister;
