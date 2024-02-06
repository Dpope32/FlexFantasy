import React, { useState } from 'react';
import './StartPage.css'; // This will be your custom CSS file for styles
import { useNavigate } from 'react-router-dom';
import flexFantasyImage from './flex-fantasy.jpg'; // Make sure the path is correct


function StartPage({ setUser }) {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const handleInputChange = (e) => {
    setUsername(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchUser(username).then((userId) => {
      if (userId) {
        // Pass the username as part of the navigate state
        navigate('/user-leagues', { state: { userId, username } }); // No need to call setUser here
      } else {
        alert('No user found with that username.');
      }
    });
  };
  

  return (
    <div className="start-page">
      <img src={flexFantasyImage} alt="Flex Fantasy" className="flex-fantasy-image" />
      <div className="table-container">
        <table className="Table">
        </table>
      </div>
      <form onSubmit={handleSubmit} className="username-form">
        <label htmlFor="username" className="username-label">
          Sleeper Username:
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={handleInputChange}
          className="username-input"
        />
        <button type="submit" className="submit-button">
          Enter
        </button>
      </form>
    </div>
  );
}

export default StartPage;

async function fetchUser(username) {

  const response = await fetch(`http://127.0.0.1:5000/user/${username}`);
  if (response.ok) {
    const data = await response.json();
    return data.user_id;
  }
  return null;
}