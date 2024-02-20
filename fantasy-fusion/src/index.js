import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // Make sure this path is correct
import App from './App'; // Make sure this path is correct
import reportWebVitals from './reportWebVitals'; // Make sure this path is correct
import { BrowserRouter as Router } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals();

