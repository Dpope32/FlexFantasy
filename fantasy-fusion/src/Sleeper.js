import React, { useState, useEffect } from 'react';
import './StartPage.css';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from 'react-google-login';
import { useLocation } from 'react-router-dom';


function Sleeper() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showTopPlayers, setShowTopPlayers] = useState(true);
  const [playerStats, setPlayerStats] = useState({});
  const [username, setUsername] = useState('');
  const location = useLocation();
  const sleeperUsernameFromProfile = location.state?.sleeperUsername;

  const navigateToSleeper = () => {
    navigate('/sleeper'); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchUser(username).then((userId) => {
      if (userId) {
        navigate('/user-leagues', { state: { userId, username } });
      } else {
        alert('No user found with that username.');
      }
    });
    
  };

  const handleInputChange = (e) => {setUsername(e.target.value);
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
    if (sleeperUsernameFromProfile) {
      setUsername(sleeperUsernameFromProfile);
      fetchUser(sleeperUsernameFromProfile).then((userId) => {
        if (userId) {
          navigate('/user-leagues', { state: { userId, username: sleeperUsernameFromProfile } });
        } else {
          alert('No user found with that username.');
        }
      });
    }
  }, [sleeperUsernameFromProfile, navigate]);

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
    <div className="sleeper">
      <div className="left-panel">
        <h2 className="left-panel-header">Flex Fantasy</h2>
        <button className="button-3-button" onClick={() => navigate('/')}>Home</button>
        <button className="model-button" onClick={() => navigate('/model')}>Research</button>
        <button className="sleeper-button" onClick={() => navigate('/sleeper')}>Sleeper</button>
        <button className="my-profile-button" onClick={() => navigate('/profile')}>My Profile</button>
        <button className="settings-button" onClick={() => navigate('/settings')}>Settings</button>
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
    );
}

export default Sleeper;