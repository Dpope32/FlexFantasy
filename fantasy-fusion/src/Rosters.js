import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './Rosters.css';
import StartPage from './StartPage';
import qbIcon from './qb.png'; 
import rbIcon from './rb.png'; 
import wrIcon from './wr.png'; 
import teIcon from './te.png'; 
import defIcon from './def.png'; 
import flexIcon from './flex.png';
import kIcon from './k.png';



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
  const initialUsername = location.state?.username.toLowerCase(); // Normalize to lowercase
  console.log('initialUsername;:', initialUsername); 
  

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
      // Fetch league rosters
     const resLeagueRosters = await fetch(`http://localhost:5000/league/${leagueId}/rosters`);
      if (!resLeagueRosters.ok) throw new Error('Roster data fetch failed');
      const leagueRostersData = await resLeagueRosters.json();
      setRosters(leagueRostersData); // Add this line to update the rosters state
      const ownerIds = leagueRostersData.map(roster => roster.owner_id);
      const uniqueOwnerIds = Array.from(new Set(ownerIds)); // Remove duplicates
  
      // Fetch league details to get the winner
      const resLeagueDetails = await fetch(`http://localhost:5000/league/${leagueId}`);
      if (!resLeagueDetails.ok) throw new Error('League details fetch failed');
      const leagueDetailsData = await resLeagueDetails.json();
    
      // Process owner IDs to fetch usernames
      console.log('Unique owner IDs:', ownerIds);
     
    
      // Fetch usernames for owner IDs
      const users = await Promise.all(uniqueOwnerIds.map(owner_id =>
        fetch(`https://api.sleeper.app/v1/user/${owner_id}`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch username for owner_id ${owner_id}`);
            return res.json();
          })
      ));
  
      // Map user IDs to usernames
      const userMap = users.reduce((acc, user) => {
        // Normalize usernames to lowercase
        const normalizedUsername = (user.display_name || user.username).toLowerCase();
        acc[user.user_id] = normalizedUsername;
        return acc;
      }, {});
    
      // Find the winner's username
      const winnerRosterId = leagueDetailsData.metadata?.latest_league_winner_roster_id;
      if (winnerRosterId) {
        const winnerRoster = leagueRostersData.find(roster => roster.roster_id.toString() === winnerRosterId.toString());
        setWinnerUsername(winnerRoster ? userMap[winnerRoster.owner_id] : "Unknown");
      }
  
      // Set the owners state with usernames, normalized to lowercase
      const updatedOwners = leagueRostersData.map(roster => ({
        owner_id: roster.owner_id,
        username: userMap[roster.owner_id] || 'Unknown'
      }));

      // Find the initial owner
      const initialOwner = updatedOwners.find(owner => owner.username === initialUsername);
      setSelectedOwner(initialOwner ? initialOwner.owner_id : updatedOwners[0].owner_id);
      console.log('Selected owner set to:', initialOwner ? initialOwner.owner_id : updatedOwners[0].owner_id);

      setOwners(updatedOwners); 
      console.log('Updated owners set:', updatedOwners);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }
  

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
      positionScores[position].sort((a, b) => b.points - a.points)
        .forEach((entry, index) => {
          positionRanks[entry.playerId] = index + 1; 
        });
    });
  
    return positionRanks;
  };
  
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
    // Find the owner object that has the username matching tempSelectedOwner
    const ownerObject = owners.find(owner => owner.username === tempSelectedOwner);
    if (ownerObject) {
      setSelectedOwner(ownerObject.owner_id); // Set selectedOwner to the owner_id, not the username
      console.log('Set selectedOwner to:', ownerObject.owner_id);
    } else {
      console.error('Owner not found for username:', tempSelectedOwner);
    }
  };
  
const handleOwnerChange = (event) => {
  // This captures the username, we need to find the associated owner_id
  setTempSelectedOwner(event.target.value.toLowerCase());
  console.log('Temp selected owner changed to:', event.target.value.toLowerCase());
};

  const ownerRoster = rosters.find(roster => {
    console.log('Comparing:', roster.owner_id, selectedOwner);
    return roster.owner_id === selectedOwner; // Remove the parentheses after owner_id and selectedOwner
  });

  if (!ownerRoster) {
    console.log('No ownerRoster found for selectedOwner:', selectedOwner); // Log when no roster is found
  }


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
    const positionIcon = positionToIconMap[position] || flexIcon;
  

  
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
      <td>
      <img src={positionIcon} alt={playerDetails.position} className="icon" />
        {' '}{playerName}
      </td>
      <td>{rank}</td>
      <td>{points}</td>
      <td>{experience}</td>
    </tr>
  );
};

return (
  <>
    <div className="left-panel">
      <h2 className="left-panel-header">Flex Fantasy</h2>
      <button className="my-profile-button">My Profile</button>
    </div>
    <div className="page-container">
      <span className="title-roster">
      {leagueName}
    </span>
      <div className="Rosters">
        <div className="controls-container">
      <button className="home-button" onClick={() => navigate('/')}>Home</button>
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
          <button className="back-button" onClick={() => navigate(-1)}>Back</button>
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
                  <th>Rank</th>
                  <th>Points</th>
                  <th>Exp</th>
                  {/* <th>Yards</th>
                  <th>TDs</th>
                  <th>PPG</th>
                  <th>KTC</th>
                  <th>Age</th> */}
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
                  <th>Rank</th>
                  <th>Points</th>
                  <th>Exp</th>
                  {/* <th>Yards</th> */}
                  {/* <th>TDs</th>
                  <th>PPG</th>
                  <th>KTC</th>
                  <th>Age</th> */}
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
                  <th>Rank</th>
                  <th>Points</th>
                  <th>Exp</th>
                  {/* <th>Yards</th>
                  <th>TDs</th>
                  <th>PPG</th>
                  <th>KTC</th>
                  <th>Age</th> */}
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
                    <th>Rank</th>
                  <th>Points</th>
                  <th>Exp</th>
                  {/* <th>Yards</th>
                  <th>TDs</th>
                  <th>PPG</th>
                  <th>KTC</th>
                  <th>Age</th> */}
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
    </>
  );
  
      }


export default Rosters;
