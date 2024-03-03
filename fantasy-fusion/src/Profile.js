
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import React, { useState, useEffect } from 'react';


function Profile() {

  const navigate = useNavigate();

  return (
    <div>
      <div className="left-panel">
        <h2 className="left-panel-header">Flex Fantasy</h2>
        <button className="button-3-button" onClick={() => navigate('/')}>Home</button>
        <button className="my-profile-button" onClick={() => navigate('/my-profile')}>My Profile</button>
        <button className="model-button" onClick={() => navigate('/model')}>Research</button>
        <button className="sleeper-button" onClick={() => navigate('/sleeper')}>Sleeper</button>
        <button className="settings-button" onClick={() => navigate('/settings')}>Settings</button>
      </div>
      <h1>User Profile</h1>
    </div>
  );
}

export default Profile;

