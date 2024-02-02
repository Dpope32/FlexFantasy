import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import UserLeagues from './UserLeagues';
import Rosters from './Rosters';
import StartPage from './StartPage';
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
        </Routes>
    </div>
  );
}

export default App;


