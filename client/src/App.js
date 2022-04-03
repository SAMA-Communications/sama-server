import './styles/App.css';

import React, { useState, useEffect } from 'react';

import Main from './components/Main'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <Main>
    </Main>
  );
}

export default App;
