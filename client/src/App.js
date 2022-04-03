import './styles/App.css';

import React, { useState, useEffect } from 'react';

import Main from './components/Main'
import Login from './components/Login'
import SignUp from './components/SignUp'

function App() {
  const [isLoginView, setIsLoginView] = useState(false);
  const [isCreateUserView, setIsCreateUserView] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoginView(!(!!token));
  }, []);

  const onLogin = () => {

  };

  const onSignUp = () => {

  };

  const onDisplaySignUp = () => {
    setIsCreateUserView(true)
    setIsLoginView(false)
  }

  const onDisplayLogin = () => {
    setIsCreateUserView(false)
    setIsLoginView(true)
  }

  if (isLoginView) {
    return <Login onSubmit={onLogin} onSignUp={onDisplaySignUp}/>;
  }
  if (isCreateUserView) {
    return <SignUp onSubmit={onSignUp} onLogin={onDisplayLogin}/>;
  }

  return <Main />;
}

export default App;
