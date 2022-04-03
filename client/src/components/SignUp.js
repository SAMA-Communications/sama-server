import React from 'react';

import '../styles/SignUp.css';

export default function SignUp({ onSubmit, onLogin, error }) {
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
        <a className="signup" onClick={onLogin}>Login</a>
      </form>
    </div>
  );

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="title">Sign Up</div>
        {renderForm}
      </div>
    </div>
  );
}