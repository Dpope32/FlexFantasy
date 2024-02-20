import React, { useState, useEffect } from 'react';
import './model.css';

// Dummy list of players for initial display
const initialPlayers = [
  'Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5',
  'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10'
];

function Model() {
  const [playerName, setPlayerName] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [players, setPlayers] = useState(initialPlayers);
  const [playerStats, setPlayerStats] = useState({});

  useEffect(() => {
    // This effect could be used to fetch player stats on component mount
    const fetchAllPlayerStats = async () => {
      const years = [2023, 2022, 2021, 2020]; // Example years
      let allStats = {};

      for (const year of years) {
        try {
          const response = await fetch(`https://api.sleeper.app/v1/stats/nfl/regular/${year}`);
          if (!response.ok) {
            throw new Error(`Error fetching stats for ${year}: ${response.status_code}`);
          }
          const data = await response.json();
          allStats[year] = data;
        } catch (error) {
          console.error('Error fetching all player stats:', error);
        }
      }
      
      setPlayerStats(allStats);
    };

    fetchAllPlayerStats();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    // Simulate an API call to get player stats
    setTimeout(() => {
      // This is where you would implement the model logic to predict player performance
      // For demonstration purposes, we're using a random value
      const predictedPoints = Math.random() * 100;
      setPrediction(predictedPoints);
      setLoading(false);
    }, 2000);

  };const handleChange = (e) => {
    const value = e.target.value;
    setPlayerName(value);
    if (value.length > 0) {
      const filteredSuggestions = initialPlayers.filter(player =>
        player.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (name) => {
    setPlayerName(name);
    setSuggestions([]);
  };

  return (
    <div className="model-page">
      <input
        value={playerName}
        onChange={handleChange}
        placeholder="Enter NFL player name"
      />
      <button onClick={handleSearch}>Search</button>
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((player, index) => (
            <li key={index} onClick={() => handleSuggestionClick(player)}>
              {player}
            </li>
          ))}
        </ul>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : (
        prediction && <p>Predicted Fantasy Points: {prediction.toFixed(2)}</p>
      )}
    </div>
  );
}

export default Model;