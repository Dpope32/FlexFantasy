import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, useFilters } from 'react-table';
import { useNavigate, useLocation } from 'react-router-dom';
import './UserLeagues.css';
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
    
    const fetchAllRostersAndPlayers = async () => {
      setIsLoading(true);
      try {
        const leaguesResponse = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${year}`);
        const leaguesData = await leaguesResponse.json();
        const rostersPromises = leaguesData.map(league => fetch(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`));
        const rostersResponses = await Promise.all(rostersPromises);
        let filteredRosters = [];
    
        for (const response of rostersResponses) {
          const rostersData = await response.json();
          const userRosters = rostersData.filter(roster => roster.owner_id === userId); 
          filteredRosters = filteredRosters.concat(userRosters);
        }
    
        setAllRosters(filteredRosters);
      } catch (error) {
        console.error('Error fetching all rosters and players info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      if (Object.keys(allPlayersInfo).length > 0 && Object.keys(playerStats2023).length > 0) {
        const newRanks = calculatePositionRanks(playerStats2023);
        setPositionRanks(newRanks);
      }
    }, [allPlayersInfo, playerStats2023]); 
    
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
  
    useEffect(() => {
      if (userId) {
        fetchAllRostersAndPlayers().then(() => {
          console.log(calculateExposure()); 
        });
      }
    }, [userId, year]);
    
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
          exposure: ((count / uniqueLeaguesCount) * 100).toFixed(2),
          player: playerInfo?.full_name || 'Unknown Player',
          position: playerInfo?.position || 'Unknown Position',
          leagues: playerLeagues[playerId] || [], 
        };
      }).filter(player => player.player !== 'Unknown Player');
    
      return playerExposureArray.sort((a, b) => b.exposure - a.exposure);
    };
    
        const displayOwnerUsernameHeader = () => {
          const owner = username;
          return owner ? (username) : '';
        };
  
        const displaySharersTable = () => {
          const sharersData = calculateExposure(); 
        
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
                    <td onClick={(event) => handleExposureClick(event, item.playerId)}>{item.exposure}%</td>

                  </tr>
                ))}
              </tbody>
            </table>
          );
        };

  const handleExposureClick = (event, playerId) => {
    event.stopPropagation(); 
    console.log(`Exposure clicked for player ID: ${playerId}`);
    const playerExposureDetails = calculateExposure().find(p => p.playerId === playerId);
    if (playerExposureDetails) {
      const modalContent = {
        player: allPlayersInfo[playerId]?.full_name || "Unknown Player",
        leagues: playerExposureDetails.leagues,
      };
      setModalContent(modalContent);
      setShowModal(true);
    }
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
            <button className="model-button" onClick={() => navigate('/model')}>Model</button>
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
const PlayerModal = ({ content, onClose }) => {
  if (!content) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  const { full_name, leagues } = content; 
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ transform: 'scale(2)' }}>
        <h2>{full_name}</h2>
        {leagues && (
          <>
            <h3>Leagues:</h3>
            <ul>
              {leagues.map((league, index) => (
                <li key={index}>{league}</li>
              ))}
            </ul>
          </>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};


export default UserLeagues;