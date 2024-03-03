import React, { useState, useEffect } from 'react';
import './StartPage.css';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from 'react-google-login';
import flexFantasyImage from './flex-fantasy.jpg';


function StartPage({ setUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showTopPlayers, setShowTopPlayers] = useState(true);
  const [playerStats, setPlayerStats] = useState({});
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createSleeperUsername, setCreateSleeperUsername] = useState('');
  const navigate = useNavigate();
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [email, setEmail] = useState('');
  const [sleeperUsername, setSleeperUsername] = useState('');
  const navigateToSleeper = () => {
    navigate('/sleeper'); 
  };
  const handleCreateUsernameChange = (e) => setCreateUsername(e.target.value);
  const handleCreatePasswordChange = (e) => setCreatePassword(e.target.value);
  const handleCreateSleeperUsernameChange = (e) => setCreateSleeperUsername(e.target.value);
  const handleLoginUsernameChange = (e) => setLoginUsername(e.target.value);
  const handleLoginPasswordChange = (e) => setLoginPassword(e.target.value);
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleSleeperUsernameChange = (e) => setSleeperUsername(e.target.value);
  
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  


  async function fetchUser(username) {
    const response = await fetch(`http://127.0.0.1:5000/user/${username}`);
    if (response.ok) {
      const data = await response.json();
      return data.user_id;
    }
    return null;
  }

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

  const uniqueSuggestions = (data) => {
    const seen = new Set();
    const filteredData = data.filter(player => {
      const playerName = player.player; 
      if (!seen.has(playerName)) {
        seen.add(playerName);
        return true;
      }
      return false;
    });
  
    return filteredData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Object containing user data from form inputs
    const userData = {
      username: createUsername,
      email: email,
      sleeperUsername: createSleeperUsername || '', // Use an empty string if createSleeperUsername is falsy
      password: createPassword
    };
    
    try {
      // Send a POST request to the Flask backend
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData), // Convert userData to a JSON string
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setUser(data); // Assuming setUser will set the user state in your app
        navigate('/profile'); // Redirect to profile page after successful registration
      } else {
        alert('Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Account creation error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    // Login logic using loginUsername and loginPassword
    try {
      const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        }),
      });

      const data = await response.json();
  
      if (response.ok) {
        // Assuming setUser will set the user state in your app and you receive a token to store
        localStorage.setItem('authToken', data.token); // Store the token
        setUser(data.user); // Set the user data
        navigate('/profile'); // Redirect to profile page after successful login
      } else {
        alert('Login failed. Please check your username and password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
    }
  };
  

  const responseGoogle = async (response) => {
    console.log(response);
    // Check if the response includes the necessary data
    if (response.tokenId) {
      try {
        // Send tokenId to the backend for verification and further processing
        const backendResponse = await fetch('http://127.0.0.1:5000/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: response.tokenId }),
        });
  
        const data = await backendResponse.json();
        if (backendResponse.ok) {
          setUser(data); // Assuming setUser will set the user state in your app
          navigate('/profile'); // Redirect to the profile page
        } else {
          // Handle errors, e.g. display a message to the user
          console.error('Failed to log in with Google:', data);
          alert('Google login failed. Please try again.');
        }
      } catch (error) {
        console.error('Error during Google login:', error);
        alert('An error occurred during Google login. Please try again.');
      }
    } else {
      // Handle the error if response doesn't include tokenId
      console.error('Google response error:', response.error);
    }
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

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setSearchTerm('');
    setSuggestions([]);
    setShowTopPlayers(false); 
    fetchPlayerStats(player); 
  };

  const handleAccountCreation = async (e) => {
    e.preventDefault();

    const userData = {
      username: createUsername,
      email: email,
      sleeperUsername: createSleeperUsername,
      password: createPassword
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        setShowSuccessPopup(true); // Show the success popup
        setTimeout(() => {
          setShowSuccessPopup(false); // Hide the popup after 3 seconds
          navigate('/profile'); // Redirect to profile page after showing the popup
        }, 3000);
      } else {
        alert('Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Account creation error:', error);
      alert('An error occurred. Please try again.');
    }
  };
  
  

  return (
    <div className="start-page">
            <img src={flexFantasyImage} alt="Flex Fantasy" className="flex-fantasy-image" />
      <div className="left-panel">
        <h2 className="left-panel-header">Flex Fantasy</h2>
        <button className="button-3-button" onClick={() => navigate('/')}>Home</button>
        <button className="my-profile-button" onClick={() => navigate('/my-profile')}>My Profile</button>
        <button className="model-button" onClick={() => navigate('/model')}>Research</button>
        <button className="sleeper-button" onClick={() => navigate('/sleeper')}>Sleeper</button>
        <button className="settings-button" onClick={() => navigate('/settings')}>Settings</button>
      </div>
      

      <div className="content">
        <div className="search-bar-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search NFL players"
            className="search-input"
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
      </div>

      <form onSubmit={handleLoginSubmit} className="login-form">
        <h2 className="login-form-header">Login</h2>
        <input
          id="loginUsername"
          name="loginUsername"
          type="text"
          placeholder="Username"
          value={loginUsername}
          onChange={handleLoginUsernameChange}
          className="username-input"
        />
        <input
          id="loginPassword"
          name="loginPassword"
          type="password"
          placeholder="Password"
          value={loginPassword}
          onChange={handleLoginPasswordChange}
          className="password-input"
          autoComplete="current-password"
        />
        <button type="submit" className="login-button">Login</button>
      </form>

      {showSuccessPopup && (
      <div className="success-popup">
        User Created Successfully!
      </div>
    )}

      {/* Account Creation Form */}
      <form onSubmit={handleAccountCreation} className="account-creation-form">
        <h2 className="create-account-form-header">Create Account</h2>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Email"
          className="email-input"
        />
        <input
          type="text"
          value={createUsername}
          onChange={handleCreateUsernameChange}
          placeholder="Username"
          className="username-input"
        />
        <input
          type="password"
          value={createPassword}
          onChange={handleCreatePasswordChange}
          placeholder="Password"
          className="password-input"
        />
        <input
          type="text"
          value={createSleeperUsername}
          onChange={handleCreateSleeperUsernameChange}
          placeholder="Sleeper Username (optional)"
          className="sleeper-username-input"
        />
        <button type="submit" className="create-account-button">Submit</button>
      </form>

      {/* Google Login */}
      <GoogleLogin
        clientId="326568789285-dloscuq7ejd31hv3929tnhqusdrnoui1.apps.googleusercontent.com"
        onSuccess={responseGoogle}
        onFailure={responseGoogle}
        cookiePolicy={'single_host_origin'}
        className="google-login-button"
      />
    </div>
  );
}

export default StartPage;