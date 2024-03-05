import React, { useState, useEffect } from 'react';
import './StartPage.css';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from 'react-google-login';
import flexFantasyImage from './flex-fantasy.jpg';
import { useAuth } from './AuthContext';


function StartPage() {
  const [user, setUser] = useState(null);
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
        setShowSuccessPopup(true); 
        setTimeout(() => {
          setShowSuccessPopup(false); 
        }, 3000);
      } else {
        alert('Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Account creation error:', error);
      alert('An error occurred. Please try again.');
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userData = {
      username: createUsername,
      email: email,
      sleeperUsername: createSleeperUsername || '', 
      password: createPassword
    };
    
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData), 
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data); 
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
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        navigate('/profile');
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
    if (response.tokenId) {
      try {
        const backendResponse = await fetch('http://127.0.0.1:5000/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: response.tokenId }),
        });
  
        const data = await backendResponse.json();
        if (backendResponse.ok) {
          setUser(data);
          navigate('/profile');
        } else {
          console.error('Failed to log in with Google:', data);
          alert('Google login failed. Please try again.');
        }
      } catch (error) {
        console.error('Error during Google login:', error);
        alert('An error occurred during Google login. Please try again.');
      }
    } else {
      console.error('Google response error:', response.error);
    }
  };
  

  return (
    <div className="start-page">
            <img src={flexFantasyImage} alt="Flex Fantasy" className="flex-fantasy-image" />
      <div className="left-panel">
        <h2 className="left-panel-header">Flex Fantasy</h2>
        <button className="model-button" onClick={() => navigate('/model')}>Research</button>
        <button className="sleeper-button" onClick={() => navigate('/sleeper')}>Sleeper</button>
        <button className="settings-button" onClick={() => navigate('/settings')}>Settings</button>
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