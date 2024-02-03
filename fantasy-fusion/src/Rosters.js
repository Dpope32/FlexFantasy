import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all players info
    fetch('http://127.0.0.1:5000/players/nfl') // Removed the extra slash
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching player info: ${response.statusText}`);
        }
        return response.json(); // Directly parsing JSON here
      })
      .then(data => setAllPlayersInfo(data))
      .catch(error => console.error('Error fetching player info:', error));

    // Fetch player stats for the year 2023
    fetch('http://127.0.0.1:5000/stats/nfl/regular/2023')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching player stats: ${response.statusText}`);
        }
        return response.json(); // Directly parsing JSON here
      })
      .then(data => setPlayerStats2023(data))
      .catch(error => console.error('Error fetching player stats:', error));

    fetchData();
  }, [leagueId]); // Removed the incorrect second array, [selectedOwner]

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
      setSelectedOwner(updatedOwners[0]?.username || '');
      setRosters(leagueRostersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  

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
  
  const handleEnterButtonClick = () => {
    // This force update isn't strictly necessary if your components are already
    // reacting properly to state changes. This function can be used for additional
    // logic that needs to run when the user confirms their owner selection.
  }; 

  const handleOwnerChange = (event) => {
    setSelectedOwner(event.target.value);
  };

  const ownerRoster = rosters.find(roster => {
    const owner = owners.find(o => o.owner_id === roster.owner_id);
    return owner?.username === selectedOwner;
  });

 

  
// Placeholder for converting roster_id to username - need more info to implement
    const rosterIdToUsername = (rosterId) => {
    const roster = rosters.find(r => r.roster_id === rosterId);
    const owner = owners.find(o => o.owner_id === roster?.owner_id);
    return owner?.username || 'Unknown';
  };


  const displayRosterDetails = (roster) => {
    return roster.players.map(playerId => {
      const playerDetails = allPlayersInfo[playerId];
      const playerStats = playerStats2023[playerId];

      return (
        <div key={playerId}>
          Owner: {selectedOwner}
          Player ID: {playerId}
          Position: {playerDetails?.position || 'Unknown'}
          Points: {playerStats?.pts_ppr || 'Unknown'}
          Rank: {playerStats?.rank_ppr || 'Unknown'}
          Exp: {playerDetails?.years_exp || 'Unknown'}
        </div>
      );
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!rosters.length) {
    return <div>No rosters found for league {leagueId}</div>;
  }

  return (
    <div className="page-container">
      <div className="Rosters">
        <div className="controls-container">
          <button className="back-button" onClick={() => navigate(-1)}>Back</button>
          <div className="owner-control">
            <label className="change-owner-label">Change Owner:</label>
            <select className="owner-dropdown" value={selectedOwner} onChange={handleOwnerChange}>
              {owners.map(owner => (
                <option key={owner.owner_id} value={owner.username}>{owner.username}</option>
              ))}
            </select>
            <button onClick={handleEnterButtonClick}>Enter</button>
          </div>
        <button className="home-button">{() => navigate(StartPage)}Home</button>
        </div>
        <h1 className="title">League Rosters</h1>
        </div>
        {ownerRoster ? (
          <div className="TableWrapper">
            <h3>{selectedOwner}'s Roster in {leagueId}</h3>
            <table className="Table">
                <thead>
                    <tr>
                    <th>Player ID</th>
                    <th>Position</th>
                    <th>Points</th>
                    <th>Rank</th>
                    <th>Exp</th>
                    </tr>
                </thead>
                <tbody>
                    {ownerRoster && ownerRoster.players && ownerRoster.players.map(playerId => {
                    const playerDetails = allPlayersInfo[playerId];
                    const playerStats = playerStats2023[playerId];
                    return (
                        <tr key={playerId}>
                        <td>{playerId}</td>
                        <td>{playerDetails?.position || 'Unknown'}</td>
                        <td>{playerStats?.pts_ppr || 'Unknown'}</td>
                        <td>{playerStats?.rank_ppr || 'Unknown'}</td>
                        <td>{playerDetails?.years_exp || 'Unknown'}</td>
                        </tr>
                    );
                    })}
                </tbody>
            </table>
        </div>
      ) : <div>Select an owner to view their roster.</div>}
    </div>
  );
  
}

export default Rosters;
