import React, { useEffect, useState } from 'react';
import { auth, supabase } from './supabaseClient';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    auth.getSession().then(({ data }) => {
      setSession(data?.session);
      if (data?.session) {
        fetchUser(data.session.user.id);
      }
      setLoading(false);
    });

    // Subscribe to auth changes
    const unsubscribe = auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        fetchUser(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe?.data?.unsubscribe?.();
  }, []);

  const fetchUser = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {session && user ? (
        <Dashboard user={user} session={session} />
      ) : (
        <LoginPage onLoginSuccess={(newSession, newUser) => {
          setSession(newSession);
          setUser(newUser);
        }} />
      )}
    </div>
  );
}

export default App;
