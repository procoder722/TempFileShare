import React, { useState } from 'react';
import '../styles/uploadpage-new.css';
import { uploadFile } from '../services/api';
import { useToast } from '../components/Toast';

export default function UploadPage({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiryDays, setExpiryDays] = useState(1);
  const [maxDownloads, setMaxDownloads] = useState(3);
  const [password, setPassword] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showToast } = useToast();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      showToast('Only PDF, JPG, and PNG files are allowed', 'error');
      return;
    }

    if (file.size > maxSize) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    setSelectedFile(file);
    showToast(`✓ File selected: ${file.name}`, 'success');
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      showToast('Please select a file', 'error');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 30, 90));
      }, 300);

      const response = await uploadFile(selectedFile, expiryDays, maxDownloads, password);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      showToast('✨ File uploaded successfully!', 'success');
      
      setTimeout(() => {
        onUploadSuccess(response);
      }, 500);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-header">
          <h1>Upload & Share</h1>
          <p>Secure temporary file sharing for everyone</p>
        </div>

        <form onSubmit={handleUpload} className="upload-form">
          <div
            className={`drag-drop-zone gradient-border ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              onChange={handleFileInputChange}
              className="file-input-hidden"
              disabled={isLoading}
            />
            <label htmlFor="file-input" className="drag-drop-label">
              {selectedFile ? (
                <>
                  <div className="file-icon">✓</div>
                  <strong className="file-name">{selectedFile.name}</strong>
                  <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="change-file">Click to change file</p>
                </>
              ) : (
                <>
                  <div className="upload-icon">📤</div>
                  <strong>Drag & drop your file here</strong>
                  <p>or click to browse</p>
                  <p className="file-types">PDF • JPG • PNG • Max 5MB</p>
                </>
              )}
            </label>

            {isLoading && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>

          <div className="options-section glow-box">
            <h3>🔐 Security Options</h3>

            <div className="options-grid">
              <div className="form-group">
                <label htmlFor="expiry">
                  ⏳ Expiry Time
                  <span className="info-badge">{expiryDays}d</span>
                </label>
                <select
                  id="expiry"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  disabled={isLoading}
                >
                  <option value={0.042}>1 Hour</option>
                  <option value={0.25}>6 Hours</option>
                  <option value={1}>1 Day</option>
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days (Max)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="downloads">
                  📥 Max Downloads
                  <span className="info-badge">{maxDownloads}</span>
                </label>
                <input
                  type="number"
                  id="downloads"
                  min="1"
                  max="100"
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="password">
                  🔑 Password <span className="optional">(Optional)</span>
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="Leave empty for no password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="security-features">
              <p>✨ <strong>Your file includes:</strong></p>
              <ul>
                <li>🔒 End-to-end protection</li>
                <li>⚡ Instant secure link generation</li>
                <li>🗑️ Automatic deletion after expiry</li>
                <li>🛡️ Download limit enforcement</li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            className={`upload-button btn-primary btn-lg ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !selectedFile}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span> Uploading...
              </>
            ) : (
              <>🚀 Upload & Generate Link</>
            )}
          </button>
        </form>
      </div>

      <div className="feature-grid">
        <div className="feature-card glow-box">
          <div className="feature-icon">⚡</div>
          <h4>Instant Sharing</h4>
          <p>Get a secure link in seconds</p>
        </div>
        <div className="feature-card glow-box">
          <div className="feature-icon">🌍</div>
          <h4>Cross-Device</h4>
          <p>Share between desktop and mobile</p>
        </div>
        <div className="feature-card glow-box">
          <div className="feature-icon">🔐</div>
          <h4>Secure</h4>
          <p>Password protected files</p>
        </div>
        <div className="feature-card glow-box">
          <div className="feature-icon">✨</div>
          <h4>Premium</h4>
          <p>No ads, no tracking, no clutter</p>
        </div>
      </div>
    </div>
  );
}
