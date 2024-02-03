import React, { useState } from 'react';
import './StartPage.css'; // This will be your custom CSS file for styles
import { useNavigate } from 'react-router-dom';

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
        setUser({ username, userId });
        navigate('/user-leagues', { state: { userId } }); // Pass userId in state
      } else {
        alert('No user found with that username.');
      }
    });
  };

  return (
    <div className="start-page">
      <h1 className="title">FlexFantasy</h1>
      <form onSubmit={handleSubmit} className="username-form">
        <label htmlFor="username" className="username-label">
          Enter Sleeper Username:
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