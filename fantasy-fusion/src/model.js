// Model.js
import React, { useState } from 'react';
import './Model.css';

function Model() {
  const [playerName, setPlayerName] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    console.log(`Fetching data for ${playerName}`);
    setTimeout(() => {
      setPrediction(Math.random() * 100); 
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="model-page">
      <input
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Enter NFL player name"
      />
      <button onClick={handleSearch}>Search</button>
      {loading ? (
        <p>Loading...</p>
      ) : (
        prediction && <p>Predicted Fantasy Points: {prediction.toFixed(2)}</p>
      )}
    </div>
  );
}

export default Model;
