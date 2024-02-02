import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
    fetch('/api/players/nfl')
      .then(response => response.json())
      .then(data => setAllPlayersInfo(data))
      .catch(error => console.error('Error fetching player info:', error));

    // Fetch player stats for the year 2023
    fetch('/api/stats/nfl/regular/2023')
      .then(response => response.json())
      .then(data => setPlayerStats2023(data))
      .catch(error => console.error('Error fetching player stats:', error));

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
        console.log("League Rosters:", leagueRostersData);

        const usernamePromises = leagueRostersData.map(roster => 
          fetch(`http://localhost:5000/user/username/${roster.owner_id}`)
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch username'))
        );

        const usernames = await Promise.all(usernamePromises);
        console.log("Usernames:", usernames);

        const updatedOwners = leagueRostersData.map(roster => {
          const usernameObj = usernames.find(u => u.user_id === roster.owner_id);
          return { owner_id: roster.owner_id, username: usernameObj ? usernameObj.username : 'Unknown' };
        });

        console.log("Updated Owners:", updatedOwners);

        setOwners(updatedOwners);
        setSelectedOwner(updatedOwners[0]?.username);
        setRosters(leagueRostersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [leagueId]);

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
    <div className="Rosters">
      <h1 className="title">League Rosters</h1>
      <div>
        <label>Change Owner:</label>
        <select className="owner-dropdown" value={selectedOwner} onChange={handleOwnerChange}>
        {owners.map(owner => (
            <option key={owner.owner_id} value={owner.username}>{owner.username}</option>
        ))}
        </select>
      </div>
      {ownerRoster ? (
        <div className="TableWrapper">
          <h3>Roster for {selectedOwner}</h3>
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
      <button className="back-button" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
  
}

export default Rosters;
