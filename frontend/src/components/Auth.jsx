import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useNavigate } from 'react-router-dom'
import supabase from './SupabaseClient'

export default function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if(session){
        navigate('/');
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if(session){
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate])

  if (!session) {
    return (<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />)
  }
  else {
    const handleLogout = async () => {
      await supabase.auth.signOut()
      setSession(null)
    }

    return (
      <div>
        <p>Logged in!</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    )
  }
}