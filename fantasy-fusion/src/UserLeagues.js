import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, useFilters } from 'react-table';
import { useNavigate, useLocation } from 'react-router-dom';
import './UserLeagues.css';
// import leaguesImage from './leagues.jpeg';


function UserLeagues() {
  const year = '2023';
  const [playerStats2023, setPlayerStats2023] = useState({});
  const [positionRanks, setPositionRanks] = useState({});
  const [leagues, setLeagues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, username } = location.state || {};
  const [rosters, setRosters] = useState([]);
  const [scoringSettings, setScoringSettings] = useState({});
  const [allRosters, setAllRosters] = useState([]);
  const [allPlayersInfo, setAllPlayersInfo] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const goToRostersPage = (leagueId, leagueName) => {
    navigate(`/rosters/${leagueId}`, { state: { leagueName, username } });
  };

  const parseScoringSettings = (settings) => {
    let scoring = 'Non-PPR'; // Default scoring
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

  useEffect(() => {
    const { userId, user } = location.state || {};

    if (userId) {
      console.log('Fetching data for user ID:', userId);
      
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
            leagueId: league.league_id, // Include leagueId in the data
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
    
    const fetchAllRostersAndPlayers = async () => {
      setIsLoading(true);
      console.log('Fetching all rosters and players...');
      try {
        // Fetching the leagues for the given user
        const leaguesResponse = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${year}`);
        if (!leaguesResponse.ok) {
          throw new Error('Failed to fetch leagues');
        }
        const leaguesData = await leaguesResponse.json();
        console.log(`Leagues for user ${userId}:`, leaguesData);
    
        // Fetching all rosters for each league
        const rostersPromises = leaguesData.map(league => fetch(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`));
        const rostersResponses = await Promise.all(rostersPromises);
        const rostersData = await Promise.all(
          rostersResponses.map(async (res) => {
            if (!res.ok) {
              throw new Error('Failed to fetch rosters for league');
            }
            return await res.json();
          })
        );
        console.log('Rosters data:', rostersData);
    
        // Flatten rosters from all leagues into one array
        const allRosters = rostersData.flat();
        setAllRosters(allRosters);
    
        // Counting player exposure
        let playerExposure = {};
        allRosters.forEach(roster => {
          if (roster.players) {
            roster.players.forEach(playerId => {
              playerExposure[playerId] = (playerExposure[playerId] || 0) + 1;
            });
          }
        });
        console.log('Player exposure:', playerExposure);
    
        // Fetch all players info
        const playersInfoResponse = await fetch('https://api.sleeper.app/v1/players/nfl');
        if (!playersInfoResponse.ok) {
          throw new Error('Failed to fetch player info');
        }
        const playersInfoData = await playersInfoResponse.json();
        setAllPlayersInfo(playersInfoData);
        console.log('Players info data:', playersInfoData);
      } catch (error) {
        console.error('Error fetching all rosters and players info:', error);
      } finally {
        setIsLoading(false);
      }
    };
    useEffect(() => {
      // Assuming you've already fetched allPlayersInfo and playerStats2023
    
      if (Object.keys(allPlayersInfo).length > 0 && Object.keys(playerStats2023).length > 0) {
        const newRanks = calculatePositionRanks(playerStats2023);
        setPositionRanks(newRanks);
      }
    }, [allPlayersInfo, playerStats2023]); // This effect depends on allPlayersInfo and playerStats2023
    
  
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
        // Make sure we have an array to work with
        if (positionScores[position] && Array.isArray(positionScores[position])) {
          positionScores[position].sort((a, b) => b.points - a.points)
            .forEach((entry, index) => {
              positionRanks[entry.playerId] = index + 1; 
            });
        }
      });
      console.log('Specific stats for Josh Allen:', playerStats['6744']);
      // Check if Josh Allen's data exists before attempting to log it
      if (positionScores.QB && positionScores.QB.some(entry => entry.playerId === '6744')) {
        console.log('Rank for Josh Allen before sorting:', positionScores['QB'].find(p => p.playerId === '6744'));
      } else {
        console.log('Josh Allen not found in positionScores.QB', positionScores.QB);
      }
      
      return positionRanks;
    };
  
    useEffect(() => {
      if (userId) {
        fetchAllRostersAndPlayers();
      }
    }, [userId, year]);
// Modify the player exposure calculation
const calculateExposure = () => {
  let playerExposure = {};
  let leaguesProcessed = []; // To track which leagues have been processed successfully
  console.log('Calculating exposure with rosters:', allRosters);

  if (allRosters) {
    allRosters.forEach((roster) => {
      if (roster && roster.players) {
        leaguesProcessed.push(roster.league_id); // Track successful processing
        roster.players.forEach((playerId) => {
          if (playerId != null) {
            playerExposure[playerId] = (playerExposure[playerId] || 0) + 1;
          }
        });
      }
    });
  }

  console.log('Leagues processed:', [...new Set(leaguesProcessed)]); // Log unique league IDs
    
    const playerExposureArray = Object.entries(playerExposure)
      .map(([playerId, count]) => {
        const playerInfo = allPlayersInfo[playerId];
        if (playerInfo && playerInfo.full_name) {
          return {
            playerId,
            exposure: ((count / allRosters.length) * 100).toFixed(2),
            player: playerInfo.full_name,
            position: playerInfo.position || 'Unknown Position',
          };
        }
        return null;
      })
      .filter(entry => entry && entry.player !== 'Unknown Player')
      .sort((a, b) => parseFloat(b.exposure) - parseFloat(a.exposure)) // This line sorts by exposure in descending order
      .slice(0, 100); // This limits the array to the top 100 players

        
          console.log('Exposure array:', playerExposureArray);
        
          return playerExposureArray;
        };
        
        const displayOwnerUsernameHeader = () => {
          const owner = username;
          return owner ? (username) : '';
        };
  
        const displaySharersTable = () => {
          const sharersData = calculateExposure(); // Calculate the data for the sharers table
        
          return (
            <table className="Table">
              <thead>
              {showModal && <PlayerModal player={modalContent} onClose={() => setShowModal(false)} />}
                <tr>
                  <th>Player</th>
                  <th>Exposure</th>
                </tr>
              </thead>
              <tbody>
                {sharersData.map((item, index) => (
                  <tr key={item.playerId} onClick={() => handlePlayerClick(item.playerId)}>
                    <td>{item.player}</td>
                    <td>{item.exposure}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
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

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useFilters, useSortBy);



  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return ( 
    
    <div className="UserLeagues">
          <div className="left-panel">
            <h2 className="left-panel-header">Flex Fantasy</h2>
            <button className="button-3-button" onClick={() => navigate('/')}>Home</button>
            <button className="my-profile-button">My Profile</button>
            <button className="model-button">Model</button>
            <button className="settings-button">Settings</button>
          </div>
          <div className="main-content">
          <h1 className="owner-header">Owner: {displayOwnerUsernameHeader()}</h1>
          <div className="TablesContainer">
        <div className="Table1Container">
        <h2 className="header-title">Shares</h2>
          {displaySharersTable()}
        </div>
        <div className="Table2Container">
        <h2 className="header-title">Leagues</h2>
          <div className="headers-container"></div>

      {/* <img src={leaguesImage} alt="Leagues" className="LeaguesImage" /> */}

        
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

        </div>
      </div>
      </div>
  );
}

const PlayerModal = ({ player, onClose }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ transform: 'scale(2)' }}>
        <h2>{player.full_name}</h2>
        <p>Rank: {player.rank}</p>
        <p>Points: {player.points}</p>
        <p>Experience: {player.experience}</p>
        <p>Yards: {player.yards}</p>
        <p>Touchdowns: {player.touchdowns}</p>
        <p>Points Per Game: {player.ppg}</p>
        <p>Keep Trade Cut Value: {player.ktc}</p>
        <p>Age: {player.age}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
export default UserLeagues;