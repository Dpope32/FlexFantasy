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
          suggestedMin: 0,
          suggestedMax: 5000, // Adjust this based on the range of your PPG data
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

  const renderStatsGrid = (playerStats, position) => {
    const customOrder = ['age', 'posrank', 'ppr', 'td', 'yds', 'gs'];
    // Initial columns to exclude for all positions
    const excludedColumns = new Set(['rank', 'g', 'vbd', 'twopp', 'td_other', 'fantpos', 'player', 'twopm']);
    
    // Additional columns to exclude for quarterbacks
    const qbExcludedColumns = position === 'QB' ? new Set(['yds_receiving', 'tgt']) : new Set();
    
    if (typeof playerStats === 'object' && Object.keys(playerStats).length > 0) {
      const firstKey = Object.keys(playerStats)[0];
      if (playerStats[firstKey]) {
        // Start with the custom order columns and add the remaining ones that are not excluded
        const columnsToRender = [
          ...customOrder,
          ...Object.keys(playerStats[firstKey]).filter(col =>
            !customOrder.includes(col) && !excludedColumns.has(col)
          )
        ];
  
        // Rename the columns based on your requirements
        const renamedColumns = columnsToRender.map(col => {
          switch (col) {
            case 'att_rushing':
              return 'Rushes';
            case 'yr':
              return 'YPR';
            case 'ya':
              return 'YPC';
            case 'yds_receiving':
              return 'Rec Yds';
            case 'yds_rushing':
              return 'Rush Yds';
            case 'td_receiving':
              return 'Rec TDs'; // Renamed 'td_receiving'
            case 'td_rushing':
              return 'Rush TDs'; // Renamed 'td_rushing'
            default:
              return col.toUpperCase(); // Keep other headers in uppercase
          }
        });
      
  
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
                  <th key={col}>{col === 'att_rushing' ? 'Rushes' : col.toUpperCase()}</th>
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
    <h2>{`${selectedPlayer} - ${getMostRecentFantpos(playerStats) || 'Position not available'}`}</h2>
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
         {selectedPlayer && hasStats && (
    <div>
      <h2>{selectedPlayer.player}</h2>
      {renderStatsGrid(playerStats, getMostRecentFantpos(playerStats))}
    </div>
  )}
      </div>
    </div>
  );
}

export default Model;
