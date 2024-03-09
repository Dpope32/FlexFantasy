import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, useFilters } from 'react-table';
import './StartPage.css';
import './Profile.css';
import hotpotImage from './Hotpot.png'; 
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';



const Profile = () => {
  const year = '2023';
  const [playerStats2023, setPlayerStats2023] = useState({});
  const [allRosters, setAllRosters] = useState([]);
  const { user, setUser } = useAuth();
  const [allPlayersInfo, setAllPlayersInfo] = useState({});
  const location = useLocation();
  const [positionRanks, setPositionRanks] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const { state } = location;
  const userId = state?.userId;
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [leagues, setLeagues] = useState([]);
  const goToRostersPage = (leagueId, leagueName) => {
    navigate(`/rosters/${leagueId}`, { state: { leagueName, username } });
  };
  
  const leagueType = (metadata) => {
    return metadata?.auto_continue === "on" ? "Dynasty" : "Redraft";
  };

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
      }
    }, []);
    

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = localStorage.getItem('authToken'); 
      console.log('Token from storage:', token); 
  
      if (!token) {
        console.log('No token found, user might not be logged in or session expired');
        // Redirect to login or handle user not logged in
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
  
        console.log('Response status:', response.status); 
  
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('User data:', data); 
        setUser(data.user_info); 
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
async function fetchUserId() {
  if (!user || !user.sleeper_username) {
    console.error('User or sleeper_username is not available.');
    return null;
  }
  try {
    const response = await fetch(`http://127.0.0.1:5000/user/${user.sleeper_username}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user ID.');
    }
    const data = await response.json();
    return data.user_id;
  } catch (error) {
    console.error('Failed to fetch user ID:', error);
    return null;
  }
}

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
    const transformedData = leaguesData.map(league => ({
      leagueId: league.league_id,
      name: league.name !== "Leagues will be posted here!" ? league.name : null,
      size: league.total_rosters,
      benchSpots: league.roster_positions.filter(pos => pos === "BN").length,
      scoringSettings: parseScoringSettings(league.scoring_settings),
      waiverBudget: league.settings.waiver_budget,
      tradeDeadline: parseTradeDeadline(league.settings.trade_deadline),
      type: league.metadata?.auto_continue === "on" ? "Dynasty" : "Redraft",
    })).filter(league => league.name);
    setLeagues(transformedData);
  } catch (error) {
    console.error('Error fetching leagues:', error);
  } finally {
    setIsLoading(false); // Loading process ends
  }
};
  
useEffect(() => {
  if (user && user.sleeper_username) {
    fetchLeagues(user.sleeper_username);
  }
}, [user, year]);

const fetchAllRostersAndPlayers = async (sleeperUsername) => {
  try {
    // First fetch the user_id using the sleeperUsername
    const userId = await fetchUserId(sleeperUsername);
  if (!userId) {
    console.error(`User ID for sleeper username '${sleeperUsername}' not found.`);
    return;
  }
    setIsLoading(true);
    const leaguesResponse = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${year}`);
    if (!leaguesResponse.ok) {
      throw new Error('Failed to fetch leagues from Sleeper API.');
    }

    const leaguesData = await leaguesResponse.json();
    const rostersPromises = leaguesData.map(league => {
      return fetch(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`);
    });
    const rostersResponses = await Promise.all(rostersPromises);
    let filteredRosters = [];

    for (const response of rostersResponses) {
      const rostersData = await response.json();
      const userRosters = rostersData.filter(roster => roster.owner_id === userId);
      filteredRosters = filteredRosters.concat(userRosters);
    }
    setAllRosters(filteredRosters);
  } catch (error) {
    console.error('Error fetching leagues:', error);
  } finally {
    setIsLoading(false); // Loading process ends
  }
};

const calculatePositionRanks = (playerStats2023) => {
  const positionScores = {};
  Object.entries(playerStats2023).forEach(([playerId, stats]) => {
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
useEffect(() => {
  const fetchData = async () => {
    if (user && user.sleeper_username) {
      console.log('Fetching data...');
      await fetchAllRostersAndPlayers(user.sleeper_username);
      // After fetchAllRostersAndPlayers, you expect allPlayersInfo to be populated.
      console.log('All rosters and player info should now be available.');
    }
  };

  fetchData();
}, [user, year]); 

const calculateExposure = () => {
  let playerExposure = {};
  let playerLeagues = {};
  let leaguesProcessed = new Set();
  console.log('All Rosters:', allRosters);

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

useEffect(() => {
  if (Object.keys(allPlayersInfo).length > 0 && allRosters.length > 0) {
    console.log('Calculating exposure since player info and rosters are available.');
    const exposureData = calculateExposure();
    console.log('Exposure data:', exposureData);
  } else {
    console.log('Waiting for player info and rosters to be available...');
  }
}, [allPlayersInfo, allRosters]);

useEffect(() => {
  if (Object.keys(allPlayersInfo).length > 0 && Object.keys(playerStats2023).length > 0) {
    const newRanks = calculatePositionRanks(playerStats2023);
    setPositionRanks(newRanks);
  }
}, [allPlayersInfo, playerStats2023]); 

  const renderLeagues = () => leagues.map(league => (
    <li key={league.league_id}>
      {league.name} - {league.season}
    </li>
  ));


const toggleChangePasswordModal = () => {
  setIsChangePasswordModalVisible(!isChangePasswordModalVisible);
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
      Header: 'Type',
      accessor: 'type', // The "type" key from your transformed data
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

  
if (!user) {
  return <div>Loading user data...</div>; // or any other fallback UI
}

return (
  <div className="profile-page">
<div className="profile-container">
  <div className="profile-picture-container">
    <img src={hotpotImage} alt="Profile" className="profile-picture" />
    <h1 className="username">{user.username || 'No Username'}</h1>
  </div>
  <div className="user-info-container">
    <div className="user-info email">
      <span className="label">Email:</span>
      <span className="value">{user.email || 'No Email'}</span>
    </div>
    <div className="user-info sleeper-username">
      <span className="label">Sleeper Username:</span>
      <span className="value">{user.sleeper_username || 'No Sleeper Username'}</span>
    </div>
    <button className="change-password-modal-button" onClick={toggleChangePasswordModal}>
            Change Password
          </button>

    </div>
        </div>
          <div className="profile-content">
            
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

