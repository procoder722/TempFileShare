import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import '../styles/sharesuccess-new.css';
import { useToast } from '../components/Toast';

export default function ShareSuccessPage({ fileData, onNewShare }) {
  const [copied, setCopied] = useState(false);
  const [showMobileUrl, setShowMobileUrl] = useState(false);
  const { showToast } = useToast();

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const getExpiryTime = () => {
    const days = fileData.expiryDays;
    const now = new Date();
    const expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return expiry.toLocaleString();
  };

  // Use mobile URL if available and user requests it
  const activeUrl = showMobileUrl && fileData.mobileShareUrl ? fileData.mobileShareUrl : fileData.shareUrl;
  const qrUrl = fileData.mobileShareUrl || fileData.shareUrl;

  return (
    <div className="share-success-page">
      <div className="success-container">
        <div className="success-header">
          <div className="success-icon">✓</div>
          <h1>File Shared Successfully!</h1>
          <p>Your secure link is ready to share</p>
        </div>

        <div className="success-content">
          <div className="share-info">
            <h2>{fileData.fileName}</h2>

            <div className="share-link-section">
              <label>Share Link {showMobileUrl && fileData.mobileShareUrl && '(Mobile)'}</label>
              <div className="share-link-box">
                <input
                  type="text"
                  value={activeUrl}
                  readOnly
                  className="share-link-input"
                />
                <button
                  className={`copy-button ${copied ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(activeUrl)}
                >
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              
              {fileData.mobileShareUrl && (
                <div className="device-toggle">
                  <button 
                    className={`device-btn ${!showMobileUrl ? 'active' : ''}`}
                    onClick={() => setShowMobileUrl(false)}
                  >
                    💻 Desktop
                  </button>
                  <button 
                    className={`device-btn ${showMobileUrl ? 'active' : ''}`}
                    onClick={() => setShowMobileUrl(true)}
                  >
                    📱 Mobile
                  </button>
                </div>
              )}
            </div>

            <div className="qr-section">
              <p>Or scan this QR code:</p>
              <QRCode
                value={qrUrl}
                size={200}
                bgcolor="#ffffff"
                fgcolor="#000000"
              />
              <p className="qr-hint">Opens on any device</p>
            </div>

            <div className="details-grid">
              <div className="detail-card">
                <span className="detail-label">⏳ Expires</span>
                <span className="detail-value">{fileData.expiryDays}d - {getExpiryTime()}</span>
              </div>
              <div className="detail-card">
                <span className="detail-label">📥 Max Downloads</span>
                <span className="detail-value">{fileData.maxDownloads}</span>
              </div>
              <div className="detail-card">
                <span className="detail-label">🔐 Password</span>
                <span className="detail-value">{fileData.hasPassword ? 'Protected' : 'None'}</span>
              </div>
            </div>

            <div className="message-box">
              <p>
                ✨ Share the link or scan the QR code! Works seamlessly on desktop and mobile.
              </p>
              {fileData.mobileShareUrl && (
                <p className="mobile-hint">
                  📱 Mobile devices should use the mobile-optimized link for best performance.
                </p>
              )}
            </div>
          </div>
        </div>

        <button className="new-share-button" onClick={onNewShare}>
          📤 Share Another File
        </button>
      </div>
    </div>
  );
}
