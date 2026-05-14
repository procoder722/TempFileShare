import React, { useState } from 'react';
import '../styles/passwordpage.css';
import { verifyPassword } from '../services/api';
import { useToast } from '../components/Toast';

export default function PasswordPage({ fileId, fileName, onVerified, onCancel }) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      showToast('Please enter a password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await verifyPassword(fileId, password);
      showToast('Password verified!', 'success');
      onVerified();
    } catch (error) {
      showToast(error.message || 'Invalid password', 'error');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-page">
      <div className="password-container">
        <div className="password-header">
          <div className="lock-icon">🔒</div>
          <h1>This File is Password Protected</h1>
          <p>Enter the password to access: <strong>{fileName}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="verify-button"
            disabled={isLoading || !password}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span> Verifying...
              </>
            ) : (
              '✓ Verify Password'
            )}
          </button>
        </form>

        <button className="cancel-button" onClick={onCancel} disabled={isLoading}>
          ← Go Back
        </button>
      </div>
    </div>
  );
}
