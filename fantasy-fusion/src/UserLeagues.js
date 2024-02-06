import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useSortBy, useFilters } from 'react-table';
import { useNavigate, useLocation } from 'react-router-dom';
import './UserLeagues.css';
import leaguesImage from './leagues.jpeg';

function UserLeagues() {
  const [leagues, setLeagues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  // Define `userId` and `username` after `location` is defined
  const { userId, username } = location.state || {};
  const goToRostersPage = (leagueId, leagueName) => {
    navigate(`/rosters/${leagueId}`, { state: { leagueName, username } });
  };
  
  
  const BackButton = () => {
    navigate(-1); 
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
    const year = '2023';
    // This extraction needs to happen inside useEffect or another function where location.state is accessed.
    const { userId, user } = location.state || {};

    if (userId) {
      console.log('Fetching data for user ID:', userId);
  
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
    }, [userId]); 
    
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
      {
        Header: 'Rosters',
        id: 'rosters',
        accessor: (row) => row.name, 
        Cell: ({ row }) => (
          <button onClick={() => goToRostersPage(row.original.leagueId, row.original.name)}>Rosters</button>
        ),
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
    return <div className="loading-container">
    <div className="loading-text">Loading...</div>
  </div>;
  }

  return (
    <div className="UserLeagues">
      <img src={leaguesImage} alt="Leagues" className="LeaguesImage" />
      <button onClick={() => navigate('/')} className="BackButton">Back</button> {/* Corrected to use navigate */}
      <div className="TableWrapper">
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
                <tr {...row.getRowProps()}>
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
  );
  
}

export default UserLeagues;