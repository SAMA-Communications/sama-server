import React from 'react';

import '../styles/Login.css';

export default function Login({ onSubmit, onSignUp, error }) {
  const handleSubmit = (event) => {
    // Prevent page reload
    event.preventDefault();

    onSubmit();
  };

  // Generate JSX code for error message
  const renderErrorMessage = () =>
    <div className="error">{error}</div>;

  const renderForm = (
    <div className="form">
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <label>Username </label>
          <input type="text" name="uname" required />
        </div>
        <div className="input-container">
          <label>Password </label>
          <input type="password" name="pass" required />
          {error && renderErrorMessage()}
        </div>
        <div className="button-container">
          <input type="submit" />
        </div>
        <a className="signup" onClick={onSignUp}>Create user</a>
      </form>
    </div>
  );

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="title">Sign In</div>
        {renderForm}
      </div>
    </div>
  );
}