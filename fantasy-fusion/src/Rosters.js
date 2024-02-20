import React, { useState, useEffect } from 'react';
import Model from './Model';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './Rosters.css';
import qbIcon from './qb.png'; 
import rbIcon from './rb.png'; 
import wrIcon from './wr.png'; 
import teIcon from './te.png'; 
import defIcon from './def.png'; 
import flexIcon from './flex.png';
import kIcon from './k.png';

function Rosters() {
  const [rosters, setRosters] = useState([]);
  const [allPlayersInfo, setAllPlayersInfo] = useState({});
  const [scoringSettings, setScoringSettings] = useState({});
  const [playerStats2023, setPlayerStats2023] = useState({});
  const [formattedScoring, setFormattedScoring] = useState("");
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tempSelectedOwner, setTempSelectedOwner] = useState('');
  const [scoringString, setScoringString] = useState("");
  const location = useLocation();
  const initialUsername = location.state?.username.toLowerCase(); 
  const navigate = useNavigate();
  const [positionRanks, setPositionRanks] = useState({});
  const [winnerUsername, setWinnerUsername] = useState("Unknown");
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [userLeagues, setUserLeagues] = useState([]);
  const [leagueName, setLeagueName] = useState(location.state?.leagueName || 'League');
const [leagueId, setLeagueId] = useState(useParams().leagueId);

  useEffect(() => {
    if (selectedOwner) {
      setIsLoading(true);
      fetch(`http://127.0.0.1:5000/user/${selectedOwner}/leagues/2023`)
        .then(response => response.json())
        .then(data => {
          setUserLeagues(data);
        })
        .catch(error => console.error('Error fetching leagues:', error))
        .finally(() => setIsLoading(false));
    }
  }, [selectedOwner]);
  
  useEffect(() => {
    fetch('http://127.0.0.1:5000/players/nfl')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching player info: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => setAllPlayersInfo(data))
      .catch(error => console.error('Error fetching player info:', error));
  
    fetch('http://127.0.0.1:5000/stats/nfl/regular/2023')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching player stats: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        setPlayerStats2023(data);
        const positionRanks = calculatePositionRanks(data);
        setPositionRanks(positionRanks); 
      })
      .catch(error => console.error('Error fetching player stats:', error));
    fetchData();
  }, [leagueId]);

  useEffect(() => {
    fetch(`https://api.sleeper.app/v1/league/${leagueId}`)
      .then(response => response.json())
      .then(data => {
        setScoringSettings(data.scoring_settings);
        setScoringString(formatScoringSettings(data.scoring_settings));
      })
      .catch(error => console.error('Error fetching league details:', error));
  }, [leagueId]);
  
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

  async function fetchData() {
    if (!leagueId) {
      console.error("League ID is undefined");
      return;
    }
    setIsLoading(true);
    try {

     const resLeagueRosters = await fetch(`http://localhost:5000/league/${leagueId}/rosters`);
      if (!resLeagueRosters.ok) throw new Error('Roster data fetch failed');
      const leagueRostersData = await resLeagueRosters.json();
      setRosters(leagueRostersData);
      const ownerIds = leagueRostersData.map(roster => roster.owner_id);
      const uniqueOwnerIds = Array.from(new Set(ownerIds));
      const resLeagueDetails = await fetch(`http://localhost:5000/league/${leagueId}`);
      if (!resLeagueDetails.ok) throw new Error('League details fetch failed');
      const leagueDetailsData = await resLeagueDetails.json();
     
      const users = await Promise.all(uniqueOwnerIds.map(owner_id =>
        fetch(`https://api.sleeper.app/v1/user/${owner_id}`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch username for owner_id ${owner_id}`);
            return res.json();
          })
      ));
  
      const userMap = users.reduce((acc, user) => {
        const normalizedUsername = (user.display_name || user.username).toLowerCase();
        acc[user.user_id] = normalizedUsername;
        return acc;
      }, {});
      
      const winnerRosterId = leagueDetailsData.metadata?.latest_league_winner_roster_id;
      if (winnerRosterId) {
        const winnerRoster = leagueRostersData.find(roster => roster.roster_id.toString() === winnerRosterId.toString());
        setWinnerUsername(winnerRoster ? userMap[winnerRoster.owner_id] : "Unknown");
      }
      const updatedOwners = leagueRostersData.map(roster => ({
        owner_id: roster.owner_id,
        username: userMap[roster.owner_id] || 'Unknown'
      }));

      const initialOwner = updatedOwners.find(owner => owner.username === initialUsername);
      setSelectedOwner(initialOwner ? initialOwner.owner_id : updatedOwners[0].owner_id);
      setOwners(updatedOwners); 
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  function formatScoringSettings(settings) {
    let formattedSettings = [];
    if (settings.rec === 1.0) {
      formattedSettings.push('PPR');
    } else if (settings.rec === 0.5) {
      formattedSettings.push('0.5 PPR');
    } else {
      formattedSettings.push('Non-PPR');
    }
    const additionalSettingsMap = {
      'bonus_rec_te': 'TEP', 
      'st_td': 'QB'  
    };
    for (let key in additionalSettingsMap) {
      if (settings.hasOwnProperty(key) && settings[key] > 0) {
        let value = settings[key];
        let suffix = key === 'st_td' ? value : ''; 
        formattedSettings.push(`${additionalSettingsMap[key]}${suffix}`);
      }
    }
  
    return formattedSettings.join(' + ');
  }

  const sortStarters = (starterIds, rosterPositions, allPlayersInfo) => {
    const positionOrder = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX'];
    const sortedStarters = [];
    const positionCounters = rosterPositions.reduce((acc, position) => {
      if (position !== 'BN') {
        acc[position] = (acc[position] || 0) + 1;
      }
      return acc;
    }, {});
  
    if (positionCounters['SUPER_FLEX']) {
      positionCounters['SF'] = positionCounters['SUPER_FLEX'];
      delete positionCounters['SUPER_FLEX'];
    }
  
    starterIds.forEach(playerId => {
      const playerInfo = allPlayersInfo[playerId];
      const playerPosition = playerInfo ? playerInfo.position : 'DEF'; 
      if (positionCounters[playerPosition] > 0) {
        sortedStarters.push(playerId);
        positionCounters[playerPosition] -= 1;
      } else if (positionCounters['FLEX'] > 0 && ['RB', 'WR', 'TE'].includes(playerPosition)) {
        sortedStarters.push(playerId);
        positionCounters['FLEX'] -= 1;
      } else if (positionCounters['SF'] > 0 && ['QB', 'RB', 'WR', 'TE'].includes(playerPosition)) {
        sortedStarters.push(playerId);
        positionCounters['SF'] -= 1;
      }
    });

    return sortedStarters.sort((a, b) => {
      let posAIndex = positionOrder.indexOf(allPlayersInfo[a]?.position || 'FLEX');
      let posBIndex = positionOrder.indexOf(allPlayersInfo[b]?.position || 'FLEX');
      posAIndex = posAIndex === -1 ? positionOrder.length : posAIndex;
      posBIndex = posBIndex === -1 ? positionOrder.length : posBIndex;
      return posAIndex - posBIndex;
    });
  };
  
  const findBenchPlayers = (roster) => {
        const allPlayers = roster.players || [];
        const starters = roster.starters || [];
        return allPlayers.filter(playerId => !starters.includes(playerId));
  };

  const handleEnterButtonClick = () => {
    const ownerObject = owners.find(owner => owner.username === tempSelectedOwner);
    if (ownerObject) {
      setSelectedOwner(ownerObject.owner_id); 
    } else {
      console.error('Owner not found for username:', tempSelectedOwner);
    }
  };
  
const handleOwnerChange = (event) => {
  setTempSelectedOwner(event.target.value.toLowerCase());
};

const capitalizeUsername = (username) => {
  return username.charAt(0).toUpperCase() + username.slice(1);
};

const displayOwnerUsernameHeader = () => {
  const owner = owners.find(o => o.owner_id === selectedOwner);
  return owner ? capitalizeUsername(owner.username) : '';
};

  const ownerRoster = rosters.find(roster => {
    return roster.owner_id === selectedOwner; 
  });

  if (isLoading) {
    return <div className="loading-container">
    <div className="loading-text">Loading...</div>
  </div>
  }

  if (!rosters.length) {
    return <div>No rosters found for league {leagueId}</div>;
  }
  const displayStarters = (roster) => {
    const totalStarters = roster.starters.length;
    return roster.starters.map((playerId, index) => {
      const playerDetails = allPlayersInfo[playerId];
      return displayPlayerRow(playerId, true, index, totalStarters, playerDetails);
    });
  };
  
  const displayBench = (roster) => {
    const benchPlayerIds = sortPlayersByPoints(findBenchPlayers(roster)); 
    return benchPlayerIds.map(playerId => displayPlayerRow(playerId, 0, 0));
  };
  
  const displayIR = (roster) => {
    const irPlayerIds = sortPlayersByPoints(roster.reserve || []); 
    return irPlayerIds.map(playerId => displayPlayerRow(playerId, 0, 0));
  };
  
  const displayTaxi = (roster) => {
    const taxiPlayerIds = sortPlayersByPoints(roster.taxi || []); 
    return taxiPlayerIds.map(playerId => displayPlayerRow(playerId, 0, 0));
  };

  const navigateToRoster = (leagueId, leagueName) => {
    setLeagueName(leagueName); 
    setLeagueId(leagueId); 
    setIsLoading(true);
    fetch(`http://localhost:5000/league/${leagueId}/rosters`)
      .then(response => response.json())
      .then(data => {
        setRosters(data);
        const ownerRoster = data.find(roster => roster.owner_id === selectedOwner);
        if (ownerRoster) {
        }
        navigate(`/rosters/${leagueId}`);
      })
      .catch(error => console.error('Error switching leagues:', error))
      .finally(() => setIsLoading(false));
  };
  
  
  const displayUserLeagues = () => {
    return userLeagues.map((league, index) => (
      <tr key={index} onClick={() => navigateToRoster(league.league_id, league.name)}>
        <td>{league.name}</td>
      </tr>
    ));
  };

  const positionToIconMap = {
      QB: qbIcon,
      RB: rbIcon,
      WR: wrIcon,
      TE: teIcon,
      FLEX: flexIcon, 
      SF: flexIcon, 
      DEF: defIcon,
      K: kIcon,
};

const sortPlayersByPoints = (playerIds) => {
    return playerIds.sort((a, b) => {
      const pointsA = playerStats2023[a]?.pts_ppr !== undefined ? playerStats2023[a]?.pts_ppr : 0;
      const pointsB = playerStats2023[b]?.pts_ppr !== undefined ? playerStats2023[b]?.pts_ppr : 0;
      return pointsB - pointsA; 
    });
  };

  const displayPlayerRow = (playerId, isStarter, index, totalStarters) => {
    const playerDetails = allPlayersInfo[playerId] || {};
    const playerStats = playerStats2023[playerId] || {};
    let rank = positionRanks[playerId] || 'N/A'; 
    let playerName = playerDetails.full_name || '(empty)';
    let position = playerDetails.position;

  const teamNameMapping = {
        MIN: "Minnesota Vikings",
        LV: "Las Vegas Raiders",
        KC: "Kansas City Chiefs",
        DEN: "Denver Broncos",
        CIN: "Cincinatti Bengals",
        CHI: "Chicago Bears",
        TEN: "Tennessee Titans",
        NYG: "New York Giants",
        NYJ: "New York Jets",
        SF: "San Francisco 49ers",
        PHI: "Philadelphia Eagles",
        BUF: "Buffalo Bills",
        DET: "Detroit Lions",
        MIA: "Miami Dolphins",
        GB: "Green Bay Packers",
        NO: "New Orleans",
        LAR: "Las Angeles Rams",
        JAX: "Jaxonville",
        CAR: "Caroline Panthers",
        ATL: "Atlanta Falcons",
        CLE: "Cleveland Browns",
        TB: "Tampa Bay Buccanears",
        LAC: "Los Angeles Chargers",
        WAS: "Washington Redskins",
        DAL: "Dallas Cowboys",
        ARI: "Arizone Cardinals",
        SEA: "Seattle Seahawks",
        IND: "Indianapolis Colds",
        PIT: "Pittsburg Steelers",
        BAL: "Baltimore Ravens",
        NE: "New England Patriots",
        HOU: "Houston Texans",
      };
    if (teamNameMapping[playerId]) {
      position = 'DEF';
      playerName = teamNameMapping[playerId];
    } else if (!playerDetails.full_name && playerId === 'DEF') {
      playerName = 'Defense';
    }

    const positionIcon = positionToIconMap[position] || flexIcon;
    const handleClick = () => {
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
    if (isStarter) {
      if (position === 'QB' && index === totalStarters - 1) {
        position = 'SF'; 
      } else if (['WR', 'RB', 'TE'].includes(position) && index >= totalStarters - 5) {
        position = 'FLEX';
      }
    }
    return (
      <tr key={playerId || `empty-${index}`} onClick={handleClick}>
        <td>
          <img src={positionIcon} alt={playerDetails.position || 'Empty'} className="icon" />
          {playerName}
        </td>
        <td>#{rank}</td>
      </tr>
    );
  };
  
  return (
    <>
      <div className="left-panel">
        <h2 className="left-panel-header">Flex Fantasy</h2>
        <button className="button-3-button" onClick={() => navigate('/')}>Home</button>
        <button className="my-profile-button">My Profile</button>
        <button className="model-button" onClick={() => navigate('/model')}>Model</button>
        <button className="settings-button">Settings</button>
      </div>
      <div className="pages-container">
        <span className="title-roster">{leagueName}</span>
        <div className="Rosters">
          <div className="controls-container">
            <h1 className="owners-header">Owner: {displayOwnerUsernameHeader()}</h1>
            <div className="scoring-settings-display">
              <h2>Scoring Settings: {scoringString}</h2>
            </div>
            <div className="league-title-container">
              <span className="winner-info">
                <span className="year">2023 </span>
                <span className="champ">Champ:</span>
                <span className="winner-username">{winnerUsername}</span>
              </span>
            </div>
            <div className="owner-control">
              <label className="change-owner-label">Change Owner:</label>
              <select className="owner-dropdown" value={tempSelectedOwner} onChange={handleOwnerChange}>
                {owners.map(owner => (
                  <option key={owner.owner_id} value={owner.username}>{owner.username}</option>
                ))}
              </select>
              <button onClick={handleEnterButtonClick}>Enter</button>
            </div>
          </div>   
          {ownerRoster ? (
            <div className="roster-container">
              <div className="left-container">
                {/* Column 1 */}
                <div className="column">
                  <div className="starters-and-ir">
                  {showModal && <PlayerModal player={modalContent} onClose={() => setShowModal(false)} />}
                    <h1 className="starters">Starters</h1>
                    <table className="Table">
                      <thead>
                        <tr>
                          <th>Player</th>
                          <th>Rank</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayStarters(ownerRoster)}
                      </tbody>
                    </table>
                    </div>
                  {ownerRoster.reserve && ownerRoster.reserve.length > 0 && (
                    <div className="starters-and-ir">
                    
                      <h1 className="ir">IR</h1>
                      <table className="Table">
                        <thead>
                          <tr>
                            <th>Player</th>
                            <th>Rank</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayIR(ownerRoster)}
                        </tbody>
                      </table>
                    
                    </div>
                  )}
                </div>
                <div className="column">
                <div className="starters-and-ir">
                    <h1 className="bench">Bench</h1>
                    <table className="Table">
                      <thead>
                        <tr>
                          <th>Player</th>
                          <th>Rank</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayBench(ownerRoster)}
                      </tbody>
                    </table>
                  </div>
                  {ownerRoster.taxi && ownerRoster.taxi.length > 0 && (
                    <div className="starters-and-ir">
                      <h1 className="taxi">Taxi</h1>
                      <table className="Table">
                        <thead>
                          <tr>
                            <th>Player</th>
                            <th>Rank</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayTaxi(ownerRoster)}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
                
              </div>
              <div className="right-container">
              <div className="other-leagues-section">
                <table className="Table">
                    <thead>
                      <tr>
                        <th>{displayOwnerUsernameHeader()}s Other Leagues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayUserLeagues(selectedOwner)}
                    </tbody>
                  </table>
                  </div>
                </div>
                </div>
          ) : (
            <div>Select an owner to view their roster.</div>
          )}
        </div>
      </div>
    </>
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

export default Rosters;

