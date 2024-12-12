import { createContext, useState, useContext, useEffect } from 'react';
import supabase from './SupabaseClient'; // assuming the path to your supabase client
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';


// this file just makes sure the session and setSession variables are globally accessible in the app

// Create Context
const SessionContext = createContext();

// Provider Component
export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        // navigate('/');
      }
    };

    fetchSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // navigate('/');
      }
    });

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      {children}
    </SessionContext.Provider>
  );
};
// Add PropTypes validation
SessionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom Hook to use the session context
export const useSession = () => useContext(SessionContext);
