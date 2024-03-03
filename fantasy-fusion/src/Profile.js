import React, { useState, useEffect } from 'react';
import './StartPage.css';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function Profile({ setUser, user }) {
  console.log(setUser);

  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);

  const handleLogout = () => {
    setUser(null); // Reset the user state
    localStorage.removeItem('authToken'); // Clear the token from local storage
    navigate('/'); // Navigate to the home page or login page
  };
  
  const fetchLeagues = async (sleeperUsername) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/user/${sleeperUsername}/leagues`);
      if (!response.ok) {
        throw new Error('Failed to fetch leagues.');
      }
      const leaguesData = await response.json();
      setLeagues(leaguesData);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  useEffect(() => {
    if (user && user.sleeperUsername) {
      fetchLeagues(user.sleeperUsername);
    }
  }, [user]);

  const renderLeagues = () => leagues.map(league => (
    <li key={league.league_id}>
      {league.name} - {league.season}
    </li>
  ));


  
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await fetch('http://127.0.0.1:5000/upload-profile-picture', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const data = await response.json();
        setUser({ ...user, profilePicture: data.imageUrl });
      } else {
        console.error('Upload failed');
        // Display an error message or notification to the user
      }
    } catch (error) {
      console.error('Error uploading the profile picture:', error);
      // Display an error message or notification to the user
    }
  };
  

  return (
    <div>
      <div className="left-panel">
        <h2 className="left-panel-header">Flex Fantasy</h2>
        <button className="button-3-button" onClick={() => navigate('/')}>Home</button>
        <button className="my-profile-button" onClick={() => navigate('/my-profile')}>My Profile</button>
        <button className="model-button" onClick={() => navigate('/model')}>Research</button>
        <button className="sleeper-button" onClick={() => navigate('/sleeper')}>Sleeper</button>
        <button className="settings-button" onClick={() => navigate('/settings')}>Settings</button>
        <button className="sign-out-button" style={{ marginTop: 'auto' }} onClick={handleLogout}>Sign Out</button>
      </div>
      <div className="profile-content">
        <h1>User Profile</h1>
        <div>
          {user && user.sleeperUsername && (
            <div>
              <h2>Sleeper Username: {user.sleeperUsername}</h2>
            </div>
          )}
          <div className="profile-picture-container">
            {user && user.profilePicture ? (
             <img src={user.profilePictureUrl} alt="Profile" />

            ) : (
              <div className="default-profile-picture">Your Picture</div>
            )}
            <input type="file" onChange={handleProfilePictureUpload} />

          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

