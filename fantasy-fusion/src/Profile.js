import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, useFilters } from 'react-table';
import './StartPage.css';
import './Profile.css';
import { Line } from 'react-chartjs-2';
import hotpotImage from './Hotpot.png'; 
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';



const Profile = () => {
  const year = '2023';
  const [playerStats2023, setPlayerStats2023] = useState({});
  const [allRosters, setAllRosters] = useState([]);
  const { user, setUser } = useAuth();
  console.log(setUser);
  const [searchTerm, setSearchTerm] = useState('');
  const [allPlayersInfo, setAllPlayersInfo] = useState({});
  const location = useLocation();
  const [positionRanks, setPositionRanks] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [userDetails, setUserDetails] = useState({});
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [sleeperUsername, setSleeperUsername] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const { state } = location;
  const userId = state?.userId;
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [leagues, setLeagues] = useState([]);
  const goToRostersPage = (leagueId, leagueName) => {
    navigate(`/rosters/${leagueId}`, { state: { leagueName, username } });
  };
  

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('authToken'); // Retrieve the token from local storage
      console.log('Retrieved token:', token); // Log the retrieved token
  
      if (!token) {
        console.log('No token found');
        return;
      }
  
      try {
        const response = await fetch('http://127.0.0.1:5000/user-info', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
  
        console.log('Response status:', response.status); // Log the response status
  
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('User data:', data); // Log the fetched user data
        setUser(data.user_info); // Adjust according to your response structure
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };
  
    fetchUserInfo();
  }, [setUser]);

  const handleLogout = () => {
    setUser(null); // Reset the user state
    localStorage.removeItem('authToken'); // Clear the token from local storage
    navigate('/'); // Navigate to the home page or login page
  };
  
// This function fetches the user_id using the sleeperUsername
async function fetchUserId(sleeperUsername) {
  const response = await fetch(`http://127.0.0.1:5000/user/${sleeperUsername}`);
  if (response.ok) {
    const data = await response.json();
    return data.user_id;
  } else {
    console.error('Failed to fetch user ID for sleeper username:', sleeperUsername);
    return null;
  }
}

// Modify the fetchLeagues function to use the above utility
const fetchLeagues = async (sleeperUsername) => {
  try {
    // First fetch the user_id using the sleeperUsername
    const userId = await fetchUserId(sleeperUsername);
    if (!userId) {
      throw new Error(`User ID for sleeper username '${sleeperUsername}' not found.`);
    }

    // Then fetch the leagues using the Sleeper API and the user_id
    const response = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${year}`);
    if (!response.ok) {
      throw new Error('Failed to fetch leagues from Sleeper API.');
    }
    const leaguesData = await response.json();
    setLeagues(leaguesData);
    console.log('Fetched leagues:', leaguesData); // Log the fetched leagues data
  } catch (error) {
    console.error('Error fetching leagues with user ID:', error);
  }
};

// Call the fetchLeagues function in useEffect
useEffect(() => {
  if (user && user.sleeperUsername) {
    fetchLeagues(user.sleeperUsername);
  }
}, [user]); // Make sure to call this effect when the user state updates
  
  useEffect(() => {
    console.log('User State:', user);
    fetchLeagues();
  }, [user]);

  useEffect(() => {
    console.log('User State:', user);
    if (user && user.sleeperUsername) {
      fetchLeagues(user.sleeperUsername);
    }
  }, [user]);

  useEffect(() => {
    const { userId, user } = location.state || {};
    if (userId) {
    fetch('http://127.0.0.1:5000/stats/nfl/regular/2023')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error fetching player stats: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Player stats for Josh Allen:', data['6744']);
      setPlayerStats2023(data);
      const positionRanks = calculatePositionRanks(data);
      setPositionRanks(positionRanks); 
    })

    .catch(error => console.error('Error fetching player stats:', error));
      fetch('http://127.0.0.1:5000/players/nfl')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching player info: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => setAllPlayersInfo(data))
      .catch(error => console.error('Error fetching player info:', error));

      fetch(`http://127.0.0.1:5000/user/${userId}/leagues/${year}`)
        .then(response => response.json())
        .then(data => {
          const transformedData = data.map(league => ({
            leagueId: league.league_id, 
            name: league.name !== "Leagues will be posted here!" ? league.name : null,
            size: league.total_rosters,
            benchSpots: league.roster_positions.filter(pos => pos === "BN").length,
            scoringSettings: parseScoringSettings(league.scoring_settings),
            waiverBudget: league.settings.waiver_budget,
            tradeDeadline: parseTradeDeadline(league.settings.trade_deadline),
          })).filter(league => league.name !== null); 
          setLeagues(transformedData);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching leagues:', error);
          setIsLoading(false);
        });
      } else {
        console.log('User ID not available');
        setIsLoading(false);
      }
    }, []);


  const renderLeagues = () => leagues.map(league => (
    <li key={league.league_id}>
      {league.name} - {league.season}
    </li>
  ));

  const isColumnAllZeros = (stats, field) => {
    if (Array.isArray(stats)) {
      return stats.length > 0 && stats.every(stat => stat[field] === 0);
    }
    console.error('stats is not an array:', stats);
    return false;
  };

  const calculatePositionRanks = (playerStats) => {
    const positionScores = {};
    Object.entries(playerStats).forEach(([playerId, stats]) => {
      const position = allPlayersInfo[playerId]?.position || 'DEF';
      if (!positionScores[position]) {
        positionScores[position] = [];
      }
      positionScores[position].push({ playerId, points: stats.pts_ppr || 0 });
    });
  
    const positionRanks = {};
    Object.keys(positionScores).forEach(position => {
      if (positionScores[position] && Array.isArray(positionScores[position])) {
        positionScores[position].sort((a, b) => b.points - a.points)
          .forEach((entry, index) => {
            positionRanks[entry.playerId] = index + 1; 
          });
      }
    });
    return positionRanks;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('http://127.0.0.1:5000/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ newPassword })
      });
  
      const data = await response.json();
      if (response.ok) {
        alert('Password changed successfully!');
        setShowChangePasswordForm(false); // Hide the form on success
        setNewPassword(''); // Clear the password input
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error) {
      alert(error);
      console.error('Password change error:', error);
    }
  };
  
  const handleBack = () => {
    setSelectedPlayer(null); 
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
  fetchPlayerStats(player); 
};

const prepareChartData = (playerStats) => {
  const years = Object.keys(playerStats).sort();
  const datasets = [
    {
      label: 'Fantasy Points',
      dataKey: 'fantpt',
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      yAxisID: 'y',
    },
    {
      label: 'Position Rank',
      dataKey: 'posrank',
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      yAxisID: 'y1',
    },
    {
      label: 'Yards',
      dataKey: 'yds',
      borderColor: 'rgb(255, 206, 86)',
      backgroundColor: 'rgba(255, 206, 86, 0.2)',
      yAxisID: 'y3',
    },
  ];

  const filteredDatasets = datasets.map(dataset => {
    const data = years.map(year => playerStats[year][dataset.dataKey]);
    const allZeros = data.every(value => value === 0);
    if (dataset.dataKey === 'posrank') {
      const maxPosRank = Math.max(...data);
      dataset.data = data.map(rank => maxPosRank - rank + 1);
    } else {
      dataset.data = data;
    }

    return allZeros ? null : dataset;
  }).filter(dataset => dataset !== null); 
  const gamesData = years.map(year => playerStats[year].gs);
  const fantptData = years.map(year => playerStats[year].fantpt);
  const ppgData = fantptData.map((totalPoints, index) => {
    const games = gamesData[index];
    return games ? (totalPoints / games).toFixed(2) : 0;
  });
  const ppgAllZeros = ppgData.every(value => value === 0);
  if (!ppgAllZeros) {
    filteredDatasets.push({
      label: 'Points Per Game',
      data: ppgData,
      borderColor: 'rgb(123, 239, 178)',
      backgroundColor: 'rgba(123, 239, 178, 0.2)',
      yAxisID: 'ppg',
    });
  }
  return {
    labels: years,
    datasets: filteredDatasets,
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

const calculateExposure = () => {
  let playerExposure = {};
  let playerLeagues = {};
  let leaguesProcessed = new Set();
  console.log('Leagues:', leagues);

  allRosters.forEach(roster => {
    if (roster.players) {
      leaguesProcessed.add(roster.league_id);
      const leagueName = leagues.find(league => league.leagueId === roster.league_id)?.name || "Unknown League";
      roster.players.forEach(playerId => {
        if (!playerLeagues[playerId]) {
          playerLeagues[playerId] = [];
        }
        playerLeagues[playerId].push(leagueName); 
        playerExposure[playerId] = (playerExposure[playerId] || 0) + 1;
      });
    }
  });

  const uniqueLeaguesCount = leagues.length; 
  const playerExposureArray = Object.entries(playerExposure).map(([playerId, count]) => {
    const playerInfo = allPlayersInfo[playerId];
    return {
      playerId,
      num: playerLeagues[playerId].length, // Number of leagues the player is found in
      exposure: ((count / uniqueLeaguesCount) * 100).toFixed(2),
      player: playerInfo?.full_name || 'Unknown Player',
      position: playerInfo?.position || 'Unknown Position',
      leagues: playerLeagues[playerId] || [], 
    };
  }).filter(player => player.player !== 'Unknown Player');

  return playerExposureArray.sort((a, b) => b.exposure - a.exposure);
};

const renamedColumns = {
  'yr': 'YPR',
  'ya': 'YPC',
  'yds_receiving': 'Rec Yds',
  'yds_rushing': 'Rush Yds',
  'td_receiving': 'Rec TDs',
  'td_rushing': 'Rush TDs',
  'att_rushing': 'Rushes',
  'ovrank' : 'OVR',
};

const data = useMemo(() => leagues, [leagues]);

const columns = useMemo(
  () => [
    {
      Header: 'League Name',
      accessor: 'name',
    },
    {
      Header: 'Size',
      accessor: 'size',
    },
    {
      Header: 'BENCH',
      accessor: 'benchSpots',
    },
    {
      Header: 'Scoring',
      accessor: 'scoringSettings',
    },
    {
      Header: 'FAAB',
      accessor: 'waiverBudget',
    },
    {
      Header: 'Trade Deadline',
      accessor: 'tradeDeadline',
    },
  ],
  [navigate]
);

const displaySharersTable = () => {
  const sharersData = calculateExposure(); 

  return (
    <table className="Table">
      <thead>
      {showModal && <PlayerModal player={modalContent} onClose={() => setShowModal(false)} />}
        <tr>
          <th>Player</th>
          <th>Num</th> 
          <th>Exposure</th>
        </tr>
      </thead>
      <tbody>
        {sharersData.map((item, index) => (
          <tr key={item.playerId} onClick={() => handlePlayerClick(item.playerId)}>
            <td>{item.player}</td>
            <td>{item.num}</td> 
            <td >{item.exposure}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const renderStatsGrid = (playerStats, position) => {
  const customOrder = ['age', 'posrank', 'ppr', 'ppg', 'td', 'yds', 'gs', 'ovrank', 'att_rushing', 'yds_rushing'];
  const excludedColumns = new Set(['rank', 'fantpt', 'g', 'vbd', 'twopp', 'td_other', 'fantpos', 'player', 'twopm']);
  const fieldsToExclude = ['cmp', 'rushes', 'rush_tds']; 
  const columnsAllZeros = fieldsToExclude.filter(field => isColumnAllZeros(playerStats, field));
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
  if (position === 'TE', 'WR') {
    excludedColumns.add('td_rushing');
    excludedColumns.add('ya');
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

const parseScoringSettings = (settings) => {
  let scoring = 'Non-PPR'; 
  if (settings.rec === 1.0) {
    scoring = 'PPR';
  } else if (settings.rec === 0.5) {
    scoring = '0.5 PPR';
  }
  if (settings.bonus_rec_te && settings.bonus_rec_te > 0) {
    scoring += ` + ${settings.bonus_rec_te} TEP`;
  }
  return scoring;
};

const parseTradeDeadline = (tradeDeadline) => {
  return tradeDeadline === 99 ? "None" : `Week ${tradeDeadline}`;
};

const handlePlayerClick = (playerId) => {
  const playerDetails = allPlayersInfo[playerId];
  const playerStats = playerStats2023[playerId];
  const rank = positionRanks[playerId] || 'N/A';
  
  const playerData = {
    full_name: playerDetails.full_name,
    rank: rank,
    points: playerStats.pts_ppr,
    experience: playerDetails.years_exp,
    yards: playerStats.yards, 
    touchdowns: playerStats.touchdowns, 
    ppg: playerStats.ppg, 
    ktc: playerStats.ktc, 
    age: playerDetails.age, 
  };
  setModalContent(playerData);
  setShowModal(true);
};

const {
  getTableProps,
  getTableBodyProps,
  headerGroups,
  rows,
  prepareRow,
} = useTable({ columns, data }, useFilters, useSortBy);

const hasStats = Object.keys(playerStats).length > 0;
  
if (!user) {
  return <div>Loading user data...</div>; // or any other fallback UI
}
return (
  <div className="profile-page">
  <div className="search-bar-container">
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter NFL player name"
        className="search-bar"
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
             <div className="profile-content">
             <div className="profile-container">
          <div className="profile-background">
            <img src={hotpotImage} alt="Profile" className="profile-picture" />
          </div>
          <div className="user-details">
            {userDetails ? (
              <>
                <h1>{user.username || 'No Username'}</h1>
                <p>Email: {user.email || 'No Email'}</p>
                <h2>Sleeper Username: {user.sleeper_username || 'No Sleeper Username'}</h2>
              </>
            ) : (
              <p>Loading user details...</p>
            )}
           {showChangePasswordForm && (
              <form onSubmit={handlePasswordChange}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  required
                />
                <button type="submit">Update Password</button>
              </form>
            )}
      </div>
        </div>
        <div className="leagues-container">
        <h2 className="header-title">Leagues</h2>
        <div className="headers-container"></div>
      <table {...getTableProps()} className="Table">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps({
                onClick: () => goToRostersPage(row.original.leagueId, row.original.name)
              })}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <div className="shares-container">
      <h2 className="header-title">Shares</h2>
        {displaySharersTable()}
      </div>
    </div>
    <div className="left-panel">
    <h2 className="left-panel-header">Flex Fantasy</h2>
      <button className="button-3-button" onClick={() => navigate('/')}>Home</button>
      <button className="model-button" onClick={() => navigate('/model')}>Research</button>
      <button className="sleeper-button" onClick={() => navigate('/sleeper')}>Sleeper</button>
      <button className="settings-button" onClick={() => navigate('/settings')}>Settings</button>
      <button className="sign-out-button" onClick={handleLogout}>Sign Out</button>
    </div>
             {selectedPlayer && (
        <button className="back-button" onClick={handleBack}>Back</button>)}
              {selectedPlayer && (
          <div className="player-info">
        <h2>{`${selectedPlayer} - ${getMostRecentFantpos(playerStats) || 'Position not available'}`}</h2>
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
    {selectedPlayer && hasStats && (
      <div className="chart-container" style={{height: '40vh', width: '80vw' }}>
        <Line 
          data={prepareChartData(playerStats)}
          options={chartOptions}
          className='chart'
        />
      </div>
    )}    
   </div>
  );
}

const PlayerModal = ({ player, onClose }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>{player.full_name || player.player}</h2>
        <div className="stats-grid">
          <p className="label">Rank:</p> <p className="value">{player.rank}</p>
          <p className="label">Points:</p> <p className="value">{player.points?.toFixed(2) || player.ppg?.toFixed(2)}</p>
          <p className="label">Experience:</p> <p className="value">{player.experience}</p>
          <p className="label">Yards:</p> <p className="value">{player.yards}</p>
          <p className="label">Touchdowns:</p> <p className="value">{player.touchdowns}</p>
          <p className="label">Points Per Game:</p> <p className="value">{player.ppg?.toFixed(2)}</p>
          <p className="label">Keep Trade Cut Value:</p> <p className="value">{player.ktc}</p>
          <p className="label">Age:</p> <p className="value">{player.age}</p>
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Profile;

