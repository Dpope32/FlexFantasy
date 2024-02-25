import React, { useState, useEffect } from 'react';
import './model.css';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; // This will register the chart type automatically


function Model() {
  const [searchTerm, setSearchTerm] = useState('');
  const [playerStats, setPlayerStats] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const navigate = useNavigate();

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
          const body = await response.text(); // Get the response body as text
          console.log(body); // Log it to the console
          const data = JSON.parse(body); // Parse it as JSON
          const uniquePlayerSuggestions = uniqueSuggestions(data);
          setSuggestions(uniquePlayerSuggestions.map(player => player.player));
        } catch (error) {
          console.error('Error fetching players:', error);
        }
      };
  
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
    fetchPlayerStats(player); 
  };

  const prepareChartData = (playerStats) => {
    const years = Object.keys(playerStats).sort();
    const fantptData = years.map(year => playerStats[year].fantpt);
    const posrankData = years.map(year => playerStats[year].posrank);
    const tdData = years.map(year => playerStats[year].td);
    const ydsData = years.map(year => playerStats[year].yds);
  
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
          data: posrankData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y1',
        },
        {
          label: 'Touchdowns',
          data: tdData,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          yAxisID: 'y2',
        },
        {
          label: 'Yards',
          data: ydsData,
          borderColor: 'rgb(255, 206, 86)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          yAxisID: 'y3',
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
          font: {
            size: 20, // Set the font size to 20
          },
        },
        grid: {
          drawOnChartArea: false, // Only show the y-axis line on the right
        },
        
      },
      y2: {
        type: 'linear',
        display: false,
        position: 'right',
        ticks: {
          color: '#fff', // Set the color to white
          font: {
            size: 20, // Set the font size to 20
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y3: {
        type: 'linear',
        display: false,
        position: 'right',
        ticks: {
          color: '#fff', // Set the color to white
          font: {
            size: 20, // Set the font size to 20
          },
        },
        grid: {
          drawOnChartArea: false,
        },
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

  const renderStatsGrid = (playerStats) => {
    // First, check if playerStats is an object and has at least one key
    if (typeof playerStats === 'object' && Object.keys(playerStats).length > 0) {
      // Determine which columns have only '0' values
      const firstKey = Object.keys(playerStats)[0];
      if (playerStats[firstKey]) { // Check if the first key's value is not null or undefined
        const excludedColumns = new Set(['td_other', 'td_receiving', 'td_rushing', 'fantpos', 'player', 'twopm']);
        const columnsToRender = Object.keys(playerStats[Object.keys(playerStats)[0]])
          .filter(col => !excludedColumns.has(col) && 
            !Object.keys(playerStats).every(year => playerStats[year][col] === 0)
          );
  
        // Rows for each year
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
                {columnsToRender.map(col => (
                  <th key={col}>{col.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows}
            </tbody>
          </table>
        );
      }
    }
  
    // Return a message or nothing if playerStats is not in the expected format
    return <div>No data available</div>;
  };
  const hasStats = Object.keys(playerStats).length > 0;
  console.log(selectedPlayer);
  return (
    <div className="model-page">
       <div className="left-panel">
        <h2 className="left-panel-header">Flex Fantasy</h2>
        <button className="button-3-button" onClick={() => navigate('/')}>Home</button>
        <button className="my-profile-button">My Profile</button>
        <button className="model-button" onClick={() => navigate('/model')}>Model</button>
        <button className="settings-button">Settings</button>
      </div>
      <div style={{ position: 'relative' }}>
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
      <div className="player-info">
        <h2>{selectedPlayer}</h2> 
        <p>{getMostRecentFantpos(playerStats) || 'Position not available'}</p>
      </div>
    )}
    {selectedPlayer && hasStats && (
      <div className="chart-container" style={{ position: 'relative', height: '40vh', width: '80vw' }}>
        <Line 
          data={prepareChartData(playerStats)}
          options={chartOptions}
        />
      </div>
    )}
      <div>
        {selectedPlayer && (
          <div>
            <h2>{selectedPlayer.player}</h2>
            {renderStatsGrid(playerStats)}
          </div>
        )}
      </div>
    </div>
  );
}

export default Model;
