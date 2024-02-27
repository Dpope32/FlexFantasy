import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import UserLeagues from './UserLeagues';
import Rosters from './Rosters';
import StartPage from './StartPage';
import Model from './Model'; 
import Profile from './Profile'; 
import Settings from './Settings'; 
import NotFound from './NotFound';
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
          <Route path="*" element={<NotFound />} />
        </Routes>
    </div>
  );
}

export default App;
