// App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext'; // Import the AuthProvider
import UserLeagues from './UserLeagues';
import Rosters from './Rosters';
import StartPage from './StartPage';
import Model from './Model'; 
import Profile from './Profile'; 
import Settings from './Settings'; 
import NotFound from './NotFound';
import Sleeper from './Sleeper';
import './App.css';

function App() {
  return (
    <div className="App">
      <AuthProvider> {/* Wrap your components in AuthProvider */}
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/user-leagues" element={<UserLeagues />} />
          <Route path="/rosters/:leagueId" element={<Rosters />} />
          <Route path="/model" element={<Model />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sleeper" element={<Sleeper />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
