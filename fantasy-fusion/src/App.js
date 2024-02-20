import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import UserLeagues from './UserLeagues';
import Rosters from './Rosters';
import StartPage from './StartPage';
import Model from './Model'; // Assuming you've created a Model component
import Profile from './Profile'; // Assuming you've created a Profile component
import Settings from './Settings'; // Assuming you've created a Settings component
import NotFound from './NotFound'; // Assuming you've created a NotFound component for unmatched routes
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  const handleSetUser = (userData) => {
    console.log('Setting user:', userData);
    setUser(userData);
  };

  return (
    <div className="App">
        <Routes>
          <Route path="/" element={<StartPage setUser={handleSetUser} />} />
          <Route path="/user-leagues" element={<UserLeagues user={user} />} />
          <Route path="/rosters/:leagueId" element={<Rosters />} />
          <Route path="/model" element={<Model />} />
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          {/* Recommended to add a 404 Not Found page for unmatched routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
    </div>
  );
}

export default App;
