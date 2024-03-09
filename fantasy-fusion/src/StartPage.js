import React, { useState } from 'react';
import './StartPage.css';
import { useNavigate } from 'react-router-dom';
import flexFantasyImage from './flex-fantasy.jpg';
import { useAuth } from './AuthContext';

function StartPage() {
  const [user, setUser] = useState(null);
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createSleeperUsername, setCreateSleeperUsername] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const navigate = useNavigate();
  const { login, fetchUser } = useAuth();

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

    
  const handleAccountCreation = async (e) => {
    e.preventDefault();
    const userData = {
      username: createUsername,
      email: email,
      sleeperUsername: createSleeperUsername,
      password: createPassword,
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
        localStorage.setItem('authToken', data.access_token);
        setUser(data.user_info); 
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
        navigate('/profile');
      } else {
        throw new Error(data.error || 'Failed to create account.');
      }
    } catch (error) {
      console.error('Account creation error:', error);
      alert(error.message || 'An error occurred. Please try again.');
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
          password: loginPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Use the correct token property returned by your backend
        localStorage.setItem('authToken', data.access_token); 
        setUser(data.user_info); // Ensure the backend sends user_info
        navigate('/profile');
      } else {
        throw new Error(data.error || 'Login failed. Please check your username and password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert(error.message || 'An error occurred during login. Please try again.');
    }
  };
  
  

  return (
    <div className="start-page">
    <img src={flexFantasyImage} alt="Flex Fantasy" className="flex-fantasy-image" />
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
        {/* Success Popup */}
        {showSuccessPopup && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded">
            User Created Successfully!
          </div>
        )}

      {/* Footer */}
      <footer className="p-4 bg-white bg-opacity-90">
        <div className="flex justify-evenly">
          <span>About</span>
          <a href="mailto:flexfantasy-business@gmail.com" className="text-blue-600 hover:underline">Contact</a>
          <span>Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}

export default StartPage;