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
      <div className="w-96">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
        />
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
