import React, { useEffect, useState } from 'react';
import '../styles/downloadpage-new.css';
import { getFileInfo, downloadFile, getFilePreview, verifyPassword, deleteFile } from '../services/api';
import { useToast } from '../components/Toast';
import PasswordPage from './PasswordPage';

export default function DownloadPage({ fileId, onBackToHome }) {
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [showPasswordPage, setShowPasswordPage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expiryCountdown, setExpiryCountdown] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchFileInfo();
  }, [fileId]);

  const fetchFileInfo = async () => {
    try {
      const info = await getFileInfo(fileId);
      setFileInfo(info);

      if (info.hasPassword) {
        setShowPasswordPage(true);
      } else {
        setPasswordVerified(true);
        loadPreview(info);
      }

      // Calculate countdown timer
      const now = new Date().getTime();
      const expiryMs = info.expiryDate - now;
      if (expiryMs > 0) {
        setExpiryCountdown(formatTimeLeft(expiryMs));
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadPreview = async (info) => {
    try {
      const response = await getFilePreview(fileId);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      // Preview might not be available for some files
    }
  };

  const getFileType = () => {
    if (!fileInfo) return null;
    const ext = fileInfo.fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    return null;
  };

  const handlePasswordVerified = () => {
    setShowPasswordPage(false);
    setPasswordVerified(true);
    loadPreview(fileInfo);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await downloadFile(fileId);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('File downloaded successfully!', 'success');

      // Update file info after download
      setTimeout(fetchFileInfo, 500);
    } catch (error) {
      showToast(error.message || 'Download failed', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure? This will permanently delete the file.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteFile(fileId);
      showToast('File deleted successfully!', 'success');
      setTimeout(() => {
        onBackToHome();
      }, 1500);
    } catch (error) {
      showToast(error.message || 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimeLeft = (ms) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  if (error) {
    return (
      <div className="download-page error-state">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h1>File Not Found</h1>
          <p>{error}</p>
          <button className="back-button" onClick={onBackToHome}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (showPasswordPage && fileInfo) {
    return (
      <PasswordPage
        fileId={fileId}
        fileName={fileInfo.fileName}
        onVerified={handlePasswordVerified}
        onCancel={onBackToHome}
      />
    );
  }

  return (
    <div className="download-page">
      <div className="download-container">
        <button className="back-link" onClick={onBackToHome}>
          ← Back to Home
        </button>

        {loading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Loading file...</p>
          </div>
        ) : (
          <>
            <div className="file-preview-section">
              {previewUrl && (
                <div className="preview-container">
                  {getFileType() === 'image' ? (
                    <img
                      src={previewUrl}
                      alt={fileInfo.fileName}
                      className="preview-image"
                      style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                    />
                  ) : getFileType() === 'pdf' ? (
                    <iframe
                      src={previewUrl}
                      type="application/pdf"
                      className="preview-iframe"
                    ></iframe>
                  ) : null}
                </div>
              )}
              {!previewUrl && (
                <div className="no-preview">
                  <div className="file-icon-large">📄</div>
                  <p>Preview not available for this file</p>
                </div>
              )}
            </div>

            <div className="file-info-section">
              <h1>{fileInfo.fileName}</h1>

              <div className="file-stats">
                <div className="stat">
                  <span className="stat-label">⏳ Expires</span>
                  <span className="stat-value">{expiryCountdown || 'Expired'}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">📥 Downloads</span>
                  <span className="stat-value">
                    {fileInfo.downloads} / {fileInfo.maxDownloads}
                  </span>
                </div>
              </div>

              {fileInfo.downloads >= fileInfo.maxDownloads - 1 && (
                <div className="warning-box">
                  ⚠️ This is your last download! The file will be deleted after this.
                </div>
              )}

              <button
                className="download-button"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <span className="spinner"></span> Downloading...
                  </>
                ) : (
                  '⬇️ Download File'
                )}
              </button>

              <button
                className="delete-button"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="spinner"></span> Deleting...
                  </>
                ) : (
                  '🗑️ Delete File'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
