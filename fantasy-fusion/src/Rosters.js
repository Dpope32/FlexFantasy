import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './Rosters.css';
import StartPage from './StartPage';

function Rosters() {
  const { leagueId } = useParams();
  const [rosters, setRosters] = useState([]);
  const [allPlayersInfo, setAllPlayersInfo] = useState({});
  const [playerStats2023, setPlayerStats2023] = useState({});
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tempSelectedOwner, setTempSelectedOwner] = useState('');
  const location = useLocation();
  const initialUsername = location.state?.username;
  const navigate = useNavigate();
  const leagueName = location.state?.leagueName || 'League';
  const [positionRanks, setPositionRanks] = useState({});
  const [winnerUsername, setWinnerUsername] = useState("Unknown");

  useEffect(() => {
    // Fetch all players info
    fetch('http://127.0.0.1:5000/players/nfl')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching player info: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => setAllPlayersInfo(data))
      .catch(error => console.error('Error fetching player info:', error));
  
    // Fetch player stats for the year 2023
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
        setPositionRanks(positionRanks); // Set the position ranks
      })
      .catch(error => console.error('Error fetching player stats:', error));
  
    fetchData();
  }, [leagueId]);

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
  
      const ownerIds = leagueRostersData.map(roster => roster.owner_id);
      const uniqueOwnerIds = Array.from(new Set(ownerIds)); // Remove duplicates
  
      const usernamePromises = uniqueOwnerIds.map(owner_id => 
        fetch(`https://api.sleeper.app/v1/user/${owner_id}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Failed to fetch username for owner_id ${owner_id}`);
            }
            return res.json();
          })
      );
      const winnerRosterId = leagueRostersData.metadata?.latest_league_winner_roster_id;
    let winnerUsername = "Unknown";
    if (winnerRosterId) {
      const winnerRoster = leagueRostersData.find(roster => roster.roster_id === winnerRosterId);
      winnerUsername = winnerRoster ? userMap[winnerRoster.owner_id] : "Unknown";
    }
    setWinnerUsername(winnerUsername); 
      const users = await Promise.all(usernamePromises);
      const userMap = users.reduce((acc, user) => {
        acc[user.user_id] = user.username;
        return acc;
      }, {});
  
      const updatedOwners = leagueRostersData.map(roster => ({
        owner_id: roster.owner_id,
        username: userMap[roster.owner_id] || 'Unknown'
      }));
  
      setOwners(updatedOwners);

    const initialOwner = updatedOwners.find(o => o.username === initialUsername);
    setTempSelectedOwner(initialOwner?.username || updatedOwners[0]?.username);
    setSelectedOwner(initialOwner?.username || updatedOwners[0]?.username);
      setTempSelectedOwner(updatedOwners[0]?.username || '');
      setSelectedOwner(updatedOwners[0]?.username || '');
      setRosters(leagueRostersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }
    //setWinnerUsername(winnerUsername);

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
      console.log(`Calculating ranks for position: ${position}`); 
      positionScores[position].sort((a, b) => b.points - a.points)
        .forEach((entry, index) => {
          console.log(`Player ID: ${entry.playerId}, Points: ${entry.points}, Rank: ${index + 1}`); 
          positionRanks[entry.playerId] = index + 1; 
        });
    });
  
    console.log('Calculated Position Ranks:', positionRanks); 
    return positionRanks;
  };
  
  const sortStarters = (starterIds, rosterPositions, allPlayersInfo) => {
    const positionOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'RB', 'RB', 'K', 'DEF'];
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
      const playerPosition = playerInfo ? playerInfo.position : 'DEF'; // Assuming 'DEF' for defense teams, as they might not have a 'position'
  
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
  
    // Return the sorted list of starters based on the position order.
    return sortedStarters.sort((a, b) => {
      let posAIndex = positionOrder.indexOf(allPlayersInfo[a]?.position || 'FLEX');
      let posBIndex = positionOrder.indexOf(allPlayersInfo[b]?.position || 'FLEX');
      posAIndex = posAIndex === -1 ? positionOrder.length : posAIndex;
      posBIndex = posBIndex === -1 ? positionOrder.length : posBIndex;
      return posAIndex - posBIndex;
    });
  };
  
    const findBenchPlayers = (roster) => {
        // Assuming 'players' includes both starters and bench players
        const allPlayers = roster.players || [];
        const starters = roster.starters || [];
        // Filter out starters to get bench players
        return allPlayers.filter(playerId => !starters.includes(playerId));
  };

  const handleEnterButtonClick = () => {
    setSelectedOwner(tempSelectedOwner);
  };
  
  const handleOwnerChange = (event) => {
    setTempSelectedOwner(event.target.value);
  };

  const ownerRoster = rosters.find(roster => {
    const owner = owners.find(o => o.owner_id === roster.owner_id);
    return owner?.username === selectedOwner;
  });


  if (isLoading) {
    return <div>Loading...</div>;
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
    const benchPlayerIds = sortPlayersByPoints(findBenchPlayers(roster)); // Sort the bench players
    return benchPlayerIds.map(playerId => displayPlayerRow(playerId, 0, 0));
  };
  
  const displayIR = (roster) => {
    const irPlayerIds = sortPlayersByPoints(roster.reserve || []); // Sort the IR players
    return irPlayerIds.map(playerId => displayPlayerRow(playerId, 0, 0));
  };
  
  const displayTaxi = (roster) => {
    const taxiPlayerIds = sortPlayersByPoints(roster.taxi || []); // Sort the Taxi players
    return taxiPlayerIds.map(playerId => displayPlayerRow(playerId, 0, 0));
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
    const rank = positionRanks[playerId] || 'Unknown';
    
    let position = playerDetails.position;
    let playerName = playerDetails.full_name;
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
    const points = playerStats.pts_ppr ? Math.round(playerStats.pts_ppr) : '0';
    const experience = playerDetails.years_exp ? playerDetails.years_exp : 'N/A';
  

  
    // Apply FLEX logic only if it's a starter
    if (isStarter) {
      if (position === 'QB' && index === totalStarters - 1) {
        position = 'SF'; 
      } else if (['WR', 'RB', 'TE'].includes(position) && index >= totalStarters - 3) {
        position = 'FLEX';
      }
    }
    
  
    return (
      <tr key={playerId}>
        <td>{playerName}</td>
        <td>{position}</td>
        <td>{points}</td>
        <td>{rank}</td> {}
        <td>{experience}</td> 
      </tr>
    );
  };

  return (
    <div className="page-container">
      <h1 className="title">League Rosters</h1>
      <div className="Rosters">
      <div className="controls-container">
        <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        <div className="league-title-container">
            <button className="league-title-button" onClick={() => { /* Handler for league title click */ }}>
            {leagueName}
            </button>
            <span className="winner-username">2023 Champ: {winnerUsername}</span>
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
          <button className="home-button" onClick={() => navigate('/')}>Home</button>
        </div>
      </div>
      {ownerRoster ? (
        <>
          <div className="roster-section">
          <h1 className="starters">Starters</h1>
            <table className="Table">
                <thead>
                    <tr>
                    <th>Player</th>
                    <th>Position</th>
                    <th>Points</th>
                    <th>Rank</th>
                    <th>Exp</th>
                    </tr>
                </thead>
                <tbody>
                {displayStarters(ownerRoster)}
                </tbody>
            </table>
          </div>
  
          <div className="roster-section">
          <h1 className="bench">Bench</h1>
            <table className="Table">
                <thead>
                    <tr>
                    <th>Player</th>
                    <th>Position</th>
                    <th>Points</th>
                    <th>Rank</th>
                    <th>Exp</th>
                    </tr>
                </thead>
                <tbody>
                {displayBench(ownerRoster)}
                </tbody>
            </table>
          </div>
        

          {ownerRoster.reserve && ownerRoster.reserve.length > 0 && (
          <div className="roster-section">
            <h1 className="ir">IR</h1>
            <table className="Table">
                <thead>
                    <tr>
                    <th>Player</th>
                    <th>Position</th>
                    <th>Points</th>
                    <th>Rank</th>
                    <th>Exp</th>
                    </tr>
                </thead>
                <tbody>
                {displayIR(ownerRoster)}
                </tbody>
            </table>
          </div>
          )}
  
          {ownerRoster.taxi && ownerRoster.taxi.length > 0 && (
            <div className="roster-section">
              <h1 className="taxi">Taxi</h1>
              <table className="Table">
                <thead>
                    <tr>
                    <th>Player</th>
                    <th>Position</th>
                    <th>Points</th>
                    <th>Rank</th>
                    <th>Exp</th>
                    </tr>
                </thead>
                <tbody>
                {displayTaxi(ownerRoster)}
                </tbody>
            </table>
            </div>
          )}
        </>
      ) : (
        <div>Select an owner to view their roster.</div>
      )}
    </div>
  );
  
      }


export default Rosters;
