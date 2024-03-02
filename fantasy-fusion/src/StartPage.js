import React, { useState, useEffect } from 'react';
import './StartPage.css';
import { useNavigate } from 'react-router-dom';
import flexFantasyImage from './flex-fantasy.jpg';

function StartPage({ setUser }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showTopPlayers, setShowTopPlayers] = useState(true);
  const [playerStats, setPlayerStats] = useState({});
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 

  const handleInputChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = await fetchUser(username);
    if (userId && password === 'yourPassword') {
      navigate('/profile', { state: { userId, username } }); 
    } else {
      alert('Invalid username or password.');
    }
  };

  async function fetchUser(username) {
    const response = await fetch(`http://127.0.0.1:5000/user/${username}`);
    if (response.ok) {
      const data = await response.json();
      return data.user_id;
    }
    return null;
  }

  const fetchPlayerStats = async (playerName) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/player/stats?name=${playerName}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const stats = await response.json();
      setPlayerStats(stats);
    } catch (error) {
      console.error('Error fetching player stats:', error);
    }
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    const userId = await fetchUser(username);
    if (userId && password === 'yourPassword') { 
      navigate('/profile', { state: { userId, username } }); 
    } else {
      alert('Invalid username or password.');
    }
  };

  const uniqueSuggestions = (data) => {
    const seen = new Set();
    const filteredData = data.filter(player => {
      const playerName = player.player; 
      if (!seen.has(playerName)) {
        seen.add(playerName);
        return true;
      }
      return false;
    });
  
    return filteredData;
  };
  

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const fetchData = async () => {
        try {
          const response = await fetch(`http://127.0.0.1:5000/api/players/search?name=${searchTerm}`);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const body = await response.text(); 
          console.log(body); 
          const data = JSON.parse(body);
          const uniquePlayerSuggestions = uniqueSuggestions(data);
          setSuggestions(uniquePlayerSuggestions.map(player => player.player));
        } catch (error) {
          console.error('Error fetching players:', error);
        }
      };
      setSuggestions([]);
      fetchData();
    }
  }, [searchTerm]);

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setSearchTerm('');
    setSuggestions([]);
    setShowTopPlayers(false); 
    fetchPlayerStats(player); 
  };

  

  return (
    <div className="start-page">
      <div className="left-panel">
        <h2 className="left-panel-header">Flex Fantasy</h2>
        <button className="button-3-button" onClick={() => navigate('/')}>Home</button>
        <button className="my-profile-button">My Profile</button>
        <button className="model-button" onClick={() => navigate('/model')}>Research</button>
        <button className="settings-button">Settings</button>
      </div>
      <div className="content">
        <img src={flexFantasyImage} alt="Flex Fantasy" className="flex-fantasy-image" />
        <div className="search-bar-container">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search NFL players"
          className="search-input"
        />
        {suggestions.length > 0 && (
          <ul className="suggestions-list">
             {suggestions.map((player, index) => (
            <li key={index} onClick={() => handleSelectPlayer(player)}>
              {player} 
            </li>
                 ))}
          </ul>
        )}
      </div>
        <form onSubmit={handleSubmit} className="username-form">
          <label htmlFor="username" className="username-label">
            Sleeper Username:
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={handleInputChange}
            className="username-input"
          />
          <button type="submit" className="submit-button">
            Enter
          </button>
        </form>
      </div>
      <form onSubmit={handleSubmitLogin} className="login-form">
      <h2 className="login-form-header">Login</h2> 
        <label >
          Username:
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={handleInputChange}
          className="username-input"
        />
        <label htmlFor="password" className="password-label">
          Password:
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          className="password-input"
        />
        <button type="login" className="login-button">
          Login
        </button>
      </form>
      <div className="right-panel">
      <div className="right-panel">
        <h2 className="right-panel-header">Flex Fantasy</h2>
        <button className="button-3-button" onClick={() => navigate('/')}>Home</button>
        <button className="my-profile-button">My Profile</button>
        <button className="model-button" onClick={() => navigate('/model')}>Research</button>
        <button className="settings-button">Settings</button>
      </div>
      </div>
    </div>
  );
}

export default StartPage;


