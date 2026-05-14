import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import ShareSuccessPage from './pages/ShareSuccessPage';
import DownloadPage from './pages/DownloadPage';
import { ToastProvider } from './components/Toast';
import './styles/app.css';

function AppRoutes() {
  const [uploadResult, setUploadResult] = useState(null);
  const navigate = useNavigate();

  const handleUploadSuccess = (result) => {
    setUploadResult({
      ...result,
      hasPassword: !!result.shareUrl // We already know this from backend
    });
    navigate('/share-success');
  };

  const handleNewShare = () => {
    setUploadResult(null);
    navigate('/');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <>
      <header className="app-header">
        <div className="app-header-content">
          <h1 className="app-title">🔐 TempFileShare Secure</h1>
          <p className="app-subtitle">Temporary File Sharing for Students</p>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<UploadPage onUploadSuccess={handleUploadSuccess} />} />
          <Route
            path="/share-success"
            element={
              uploadResult ? (
                <ShareSuccessPage fileData={uploadResult} onNewShare={handleNewShare} />
              ) : (
                <UploadPage onUploadSuccess={handleUploadSuccess} />
              )
            }
          />
          <Route
            path="/share/:fileId"
            element={<DownloadPageWrapper onBackToHome={handleBackToHome} />}
          />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>
          © 2024 TempFileShare Secure | Files are automatically deleted after expiry or download limit
        </p>
      </footer>
    </>
  );
}

function DownloadPageWrapper({ onBackToHome }) {
  const { fileId } = useParams();
  return <DownloadPage fileId={fileId} onBackToHome={onBackToHome} />;
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ToastProvider>
  );
}
