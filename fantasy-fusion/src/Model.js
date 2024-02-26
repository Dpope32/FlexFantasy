import React, { useState, useEffect } from 'react';
import './model.css';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; 
import playerNames from './playerNames.json';

function Model() {
  const [searchTerm, setSearchTerm] = useState('');
  const [playerStats, setPlayerStats] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const navigate = useNavigate();
  const [showTopPlayers, setShowTopPlayers] = useState(true);
  const topPlayerIds = {
    2018: ['2315','4866','4034', '4035', '4046', '3321','3164', '1466', '536', '2133'],
    2023: ["4034", "6786", "2212", "3321", "6904", "2749", "7547", "3294", "2216", "4881"],
    2022: ["4046", "5850", "4034", "3198", "6794", "4663", "2212", "2133", "1466", "4988"],
    2021: ["6813", "4039", "5872", "2212", "4663", "6797", "167", "7564", "5012", "6794"],
    2020: ["3198", "4035", "4029", "2133", "1466", "3321", "2212", "96", "5849", "4046"],
    2019: ["4034", "4881", "3198", "4199", "3164", "4029", "3199", "1466", "4988", "956"],
  };

  const handleBack = () => {
    setSelectedPlayer(null); // Deselect the player
    setShowTopPlayers(true); // Show the top players again
  };

  const uniqueSuggestions = (data) => {
    const seen = new Set();
    const filteredData = data.filter(player => {
      const playerName = player.player; // Assuming this is the structure of your player object
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


  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setSearchTerm('');
    setSuggestions([]);
    setShowTopPlayers(false); 
    fetchPlayerStats(player); 
  };

  const prepareChartData = (playerStats) => {
    const years = Object.keys(playerStats).sort();
    const fantptData = years.map(year => playerStats[year].fantpt);
    const posrankData = years.map(year => playerStats[year].posrank);
    const ydsData = years.map(year => playerStats[year].yds);
    const gamesData = years.map(year => playerStats[year].gs); // Use 'gs' for games played
  
    // Calculate points per game using 'gs'
    const ppgData = fantptData.map((totalPoints, index) => {
      const games = gamesData[index];
      return games ? (totalPoints / games).toFixed(2) : 0; // Avoid division by zero
    });
    // Find the maximum pos_rank for inversion
    const maxPosRank = Math.max(...posrankData);
  
    // Invert pos_rank values by subtracting from the maxPosRank
    const invertedPosRankData = posrankData.map(rank => maxPosRank - rank + 1); // +1 ensures that the lowest rank is not zero
  
    return {
      labels: years,
      datasets: [
        {
          label: 'Fantasy Points',
          data: fantptData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y',
        },
        {
          label: 'Position Rank',
          data: invertedPosRankData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1',
        },
        {
          label: 'Yards',
          data: ydsData,
          borderColor: 'rgb(255, 206, 86)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          yAxisID: 'y3',
        },
        {
          label: 'Points Per Game',
          data: ppgData,
          borderColor: 'rgb(123, 239, 178)',
          backgroundColor: 'rgba(123, 239, 178, 0.2)',
          yAxisID: 'ppg', // Assign the new y-axis here
        },
      ],
    };
  };

  const chartOptions = {
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
          ticks: {
            color: '#fff', // Change the color to fit your theme
            font: {
              size: 20, // Increase the font size here
            },
          },
      },
      x: {
        ticks: {
          color: '#fff', // Set the color to white
          font: {
            size: 20, // Set the font size to 20
          },
        },
      },
  
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: {
          color: '#fff', // Set the color to white
          suggestedMin: 0,
          suggestedMax: 100, // Adjust this based on the range of your PPG data
          
          font: {
            size: 20, // Set the font size to 20
          },
        },
        grid: {
          drawOnChartArea: false, // Only show the y-axis line on the right
        },
        
      },

      y3: {
        type: 'linear',
        display: false,
        position: 'right',
        ticks: {
          color: '#fff', // Set the color to white
          min: 0, // Absolute minimum
          max: 5000 ,// Absolute maximum
          font: {
            size: 20, // Set the font size to 20
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y4: { // Add this new y-axis for PPG
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'PPG'
        },
        ticks: {
          color: '#fff',
          font: {
            size: 20,
          },
          // You can adjust the suggestedMin and suggestedMax to scale your data appropriately
          suggestedMin: 0,
          suggestedMax: 30, // Adjust this based on the range of your PPG data
        }
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff', // Change the color to fit your theme
          font: {
            size: 20, // Increase the font size here
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const getMostRecentFantpos = (stats) => {
    const sortedYears = Object.keys(stats).sort().reverse();
    if (sortedYears.length === 0) return null; // or a default value like 'N/A'
    
    const mostRecentYear = sortedYears[0];
    const mostRecentStats = stats[mostRecentYear];
    return mostRecentStats ? mostRecentStats.fantpos : null; // or a default value
  };

  const renamedColumns = {
    'yr': 'YPR',
    'ya': 'YPC',
    'yds_receiving': 'Rec Yds',
    'yds_rushing': 'Rush Yds',
    'td_receiving': 'Rec TDs',
    'td_rushing': 'Rush TDs',
    'att_rushing': 'Rushes'
  };

  const renderStatsGrid = (playerStats, position) => {
    const customOrder = ['age', 'posrank', 'ppr', 'ppg', 'td', 'yds', 'gs', 'att', 'cmp', 'att_rushing', 'yds_rushing'];
    const excludedColumns = new Set(['rank', 'fantpt', 'g', 'vbd', 'twopp', 'td_other', 'fantpos', 'player', 'twopm']);
  if (position !== 'QB') {
    excludedColumns.add('att');
    excludedColumns.add('cmp');
    excludedColumns.add('int');
  }
    if (position === 'QB') {
      excludedColumns.add('tgt');
      excludedColumns.add('td_receiving');
      excludedColumns.add('yds_receiving');
      excludedColumns.add('rec');
    }
    if (typeof playerStats === 'object' && Object.keys(playerStats).length > 0) {
      const firstKey = Object.keys(playerStats)[0];
      if (playerStats[firstKey]) {
        Object.keys(playerStats).forEach(year => {
          const ppr = playerStats[year]['ppr'];
          const games = playerStats[year]['gs'];
          playerStats[year]['ppg'] = games > 0 ? (ppr / games).toFixed(2) : 0;
        });
        const columnsToRender = [
          ...customOrder,
          ...Object.keys(playerStats[firstKey]).filter(col =>
            !customOrder.includes(col) && !excludedColumns.has(col)
          )
        ];
      
  const rows = Object.keys(playerStats).map(year => (
    <tr key={year}>
      <th>{year}</th>
      {columnsToRender.map(col => (
        <td key={col}>{playerStats[year][col]}</td>
      ))}
    </tr>
  ));

  return (
    <table>
      <thead>
        <tr>
          <th>Year</th>
          {columnsToRender.map(col => {
            // Use the renamed column if it exists, otherwise use the original column name
            const displayName = renamedColumns[col] || col;
            return <th key={col}>{displayName}</th>;
          })}
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  );
}
}
return <div>No data available</div>;
};
  const hasStats = Object.keys(playerStats).length > 0;


  const ModelPage = () => {
    const [isPlayerSelected, setIsPlayerSelected] = useState(false);
    return (
      <div>
        {/* Rest of your component JSX goes here */}
      </div>
    );
  }

  return (
    <div className="model-page">
      <div className="left-panel">
        <h2 className="left-panel-header">Flex Fantasy</h2>
        <button className="button-3-button" onClick={() => navigate('/')}>Home</button>
        <button className="my-profile-button">My Profile</button>
        <button className="model-button" onClick={() => navigate('/model')}>Model</button>
        <button className="settings-button">Settings</button>
      </div>

      {/* Conditionally render the header based on whether a player is selected */}
      {!selectedPlayer && (
        <header className="main-header">
          <span>Model</span>
        </header>
      )}

      {/* Main content area */}
      <div className="main-content">
    <div className="search-section">
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter NFL player name"
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
             {selectedPlayer && (
        <button className="back-button" onClick={handleBack}>
          Back
        </button>
      )}
              {selectedPlayer && (
          <div className="player-info">
        <h2>{`${selectedPlayer} - ${getMostRecentFantpos(playerStats) || 'Position not available'}`}</h2>
      </div>
    )}
    {showTopPlayers && (
      <div className="top-players-container">
        {Object.entries(topPlayerIds).map(([year, playerIds]) => (
          <div key={year} className="top-players-year">
            <h3>{year}</h3>
            {playerIds.map((playerId, index) => (
              <div
                key={playerId}
                className="top-player"
                onClick={() => handleSelectPlayer(playerNames[year][playerId])}
              >
                {`${index + 1}. ${playerNames[year][playerId] || `Player ${playerId}`}`}
              </div>
            ))}
          </div>
        ))}
      </div>
    )}
    {selectedPlayer && hasStats && (
      <div className="chart-container" style={{height: '50vh', width: '120vw' }}>
        <Line 
          data={prepareChartData(playerStats)}
          options={chartOptions}
        />
      </div>
    )}
      <div>
         {selectedPlayer && hasStats && (
            <div>

              <h2>{selectedPlayer.player}</h2>
              {renderStatsGrid(playerStats, getMostRecentFantpos(playerStats))}
            </div>
          )}
      </div>
    </div>
    </div>
  );
  
}

export default Model;
