import './styles/App.css';

import React, { useState, useEffect } from 'react';

import Main from './components/Main'
import Login from './components/Login'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  if (!isLoggedIn) {
    return <Login />;
  }

  return <Main />;
}

export default App;
