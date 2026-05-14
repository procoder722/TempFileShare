// Get API base URL from environment or construct from current hostname
export function getApiUrl() {
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Smart fallback: use current hostname with backend port (65489)
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:65489`;
}

export async function uploadFile(file, expiryDays, maxDownloads, password) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('expiryDays', expiryDays);
  formData.append('maxDownloads', maxDownloads);
  if (password) {
    formData.append('password', password);
  }

  const response = await fetch(`${getApiUrl()}/api/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return await response.json();
}

export async function getFileInfo(fileId) {
  const response = await fetch(`${getApiUrl()}/api/files/${fileId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'File not found');
  }

  return await response.json();
}

export async function verifyPassword(fileId, password) {
  const response = await fetch(`${getApiUrl()}/api/files/${fileId}/verify-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Password verification failed');
  }

  return await response.json();
}

export async function downloadFile(fileId) {
  const response = await fetch(`${getApiUrl()}/api/files/${fileId}/download`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Download failed');
  }

  return response;
}

export async function getFilePreview(fileId) {
  const response = await fetch(`${getApiUrl()}/api/files/${fileId}/preview`);

  if (!response.ok) {
    throw new Error('Preview failed');
  }

  return response;
}

export async function deleteFile(fileId) {
  const response = await fetch(`${getApiUrl()}/api/files/${fileId}/delete`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Delete failed');
  }

  return await response.json();
}
