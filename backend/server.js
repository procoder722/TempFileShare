import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import cors from 'cors';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';
import getPort from 'get-port';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// =========================
// CONFIG
// =========================
const DEFAULT_PORT = parseInt(process.env.PORT) || 5000;
const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:5173';

const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// =========================
// GET LOCAL IP
// =========================
function getLocalIP() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  return 'localhost';
}

// =========================
// CORS
// =========================
const corsOptions = {
  origin: (origin, callback) => {
    const localIP = getLocalIP();

    const allowedOrigins = [
      ...FRONTEND_URL.split(',').map((url) => url.trim()),
      'http://localhost:5173',
      'http://localhost:3000',
      `http://${localIP}:5173`,
      `http://${localIP}:3000`
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },

  credentials: true,

  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],

  allowedHeaders: ['Content-Type']
};

// =========================
// MIDDLEWARE
// =========================
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

app.use(
  express.urlencoded({
    limit: '10mb',
    extended: true
  })
);

// =========================
// CREATE REQUIRED FILES/FOLDERS
// =========================
if (!fsSync.existsSync(UPLOADS_DIR)) {
  fsSync.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fsSync.existsSync(DATA_FILE)) {
  fsSync.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// =========================
// MULTER CONFIG
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },

  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },

  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Only PDF, JPG, and PNG files are allowed')
      );
    }
  }
});

// =========================
// FILE HELPERS
// =========================
async function readFileData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Read file error:', error);
    return [];
  }
}

async function writeFileData(data) {
  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(data, null, 2)
  );
}

// =========================
// SHARE URL
// =========================
function getShareUrl(fileId, mobile = false) {
  const frontend =
    FRONTEND_URL.split(',')[0].trim();

  if (mobile) {
    const localIP = getLocalIP();

    return `${frontend.replace(
      'localhost',
      localIP
    )}/share/${fileId}`;
  }

  return `${frontend}/share/${fileId}`;
}

// =========================
// CLEANUP JOB
// =========================
async function cleanupFiles() {
  try {
    const now = Date.now();

    let files = await readFileData();

    let updated = false;

    for (const file of [...files]) {
      const expired =
        file.expiryDate && now > file.expiryDate;

      const limitReached =
        file.downloads >= file.maxDownloads;

      if (expired || limitReached) {
        const filePath = path.join(
          UPLOADS_DIR,
          file.fileId
        );

        try {
          await fs.unlink(filePath);
          console.log(`🗑 Deleted file: ${file.fileName}`);
        } catch (err) {
          console.error(
            'Delete file error:',
            err.message
          );
        }

        files = files.filter((f) => f.id !== file.id);

        updated = true;
      }
    }

    if (updated) {
      await writeFileData(files);
      console.log('🧹 Cleanup completed');
    }
  } catch (error) {
    console.error('Cleanup job error:', error);
  }
}

// Cleanup every 2 mins
setInterval(cleanupFiles, 2 * 60 * 1000);

// =========================
// HEALTH ROUTE
// =========================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok'
  });
});

// =========================
// UPLOAD ROUTE
// =========================
app.post(
  '/api/upload',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded'
        });
      }

      let expiryDays =
        parseInt(req.body.expiryDays) || 1;

      let maxDownloads =
        parseInt(req.body.maxDownloads) || 3;

      const password = req.body.password || '';

      if (expiryDays < 1 || expiryDays > 30) {
        return res.status(400).json({
          error:
            'Expiry days must be between 1 and 30'
        });
      }

      if (
        maxDownloads < 1 ||
        maxDownloads > 100
      ) {
        return res.status(400).json({
          error:
            'Max downloads must be between 1 and 100'
        });
      }

      let passwordHash = null;

      if (password) {
        passwordHash = await bcrypt.hash(
          password,
          10
        );
      }

      const fileId = uuidv4();

      const uploadDate = Date.now();

      const expiryDate =
        uploadDate +
        expiryDays * 24 * 60 * 60 * 1000;

      const fileData = {
        id: fileId,

        fileName: req.file.originalname,

        fileId: req.file.filename,

        uploadDate,

        expiryDate,

        maxDownloads,

        downloads: 0,

        passwordHash,

        hasPassword: !!password
      };

      const allFiles = await readFileData();

      allFiles.push(fileData);

      await writeFileData(allFiles);

      res.json({
        success: true,

        fileId,

        fileName: req.file.originalname,

        shareUrl: getShareUrl(fileId),

        mobileShareUrl: getShareUrl(
          fileId,
          true
        ),

        expiryDays,

        maxDownloads
      });
    } catch (error) {
      console.error('Upload error:', error);

      res.status(500).json({
        error: error.message || 'Upload failed'
      });
    }
  }
);

// =========================
// GET FILE INFO
// =========================
app.get('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const files = await readFileData();

    const file = files.find((f) => f.id === id);

    if (!file) {
      return res.status(404).json({
        error: 'File not found'
      });
    }

    const now = Date.now();

    if (file.expiryDate && now > file.expiryDate) {
      return res.status(410).json({
        error: 'File expired'
      });
    }

    if (
      file.downloads >= file.maxDownloads
    ) {
      return res.status(410).json({
        error: 'Download limit reached'
      });
    }

    res.json({
      id: file.id,

      fileName: file.fileName,

      downloads: file.downloads,

      maxDownloads: file.maxDownloads,

      hasPassword: file.hasPassword,

      expiryDate: file.expiryDate,

      uploadDate: file.uploadDate
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to get file info'
    });
  }
});

// =========================
// VERIFY PASSWORD
// =========================
app.post(
  '/api/files/:id/verify-password',
  async (req, res) => {
    try {
      const { id } = req.params;

      const { password } = req.body;

      const files = await readFileData();

      const file = files.find(
        (f) => f.id === id
      );

      if (!file) {
        return res.status(404).json({
          error: 'File not found'
        });
      }

      if (!file.passwordHash) {
        return res.json({
          verified: true
        });
      }

      const valid = await bcrypt.compare(
        password,
        file.passwordHash
      );

      if (!valid) {
        return res.status(401).json({
          error: 'Invalid password'
        });
      }

      res.json({
        verified: true
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Password verification failed'
      });
    }
  }
);

// =========================
// DOWNLOAD FILE
// =========================
app.get(
  '/api/files/:id/download',
  async (req, res) => {
    try {
      const { id } = req.params;

      const files = await readFileData();

      const fileIndex = files.findIndex(
        (f) => f.id === id
      );

      if (fileIndex === -1) {
        return res.status(404).json({
          error: 'File not found'
        });
      }

      const file = files[fileIndex];

      const now = Date.now();

      if (file.expiryDate && now > file.expiryDate) {
        return res.status(410).json({
          error: 'File expired'
        });
      }

      if (
        file.downloads >= file.maxDownloads
      ) {
        return res.status(410).json({
          error: 'Download limit reached'
        });
      }

      const filePath = path.join(
        UPLOADS_DIR,
        file.fileId
      );

      if (!fsSync.existsSync(filePath)) {
        return res.status(404).json({
          error: 'File missing from disk'
        });
      }

      // increment downloads
      files[fileIndex].downloads += 1;

      await writeFileData(files);

      res.download(
        filePath,
        file.fileName,
        async (err) => {
          if (err) {
            console.error(
              'Download callback error:',
              err
            );
          }

          try {
            const updatedFiles =
              await readFileData();

            const updatedFile =
              updatedFiles.find(
                (f) => f.id === id
              );

            if (
              updatedFile &&
              updatedFile.downloads >=
                updatedFile.maxDownloads
            ) {
              try {
                await fs.unlink(filePath);
              } catch (e) {
                console.error(e.message);
              }

              const remaining =
                updatedFiles.filter(
                  (f) => f.id !== id
                );

              await writeFileData(remaining);
            }
          } catch (error) {
            console.error(
              'Post-download cleanup error:',
              error
            );
          }
        }
      );
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Download failed'
      });
    }
  }
);

// =========================
// PREVIEW FILE
// =========================
app.get(
  '/api/files/:id/preview',
  async (req, res) => {
    try {
      const { id } = req.params;

      const files = await readFileData();

      const file = files.find(
        (f) => f.id === id
      );

      if (!file) {
        return res.status(404).json({
          error: 'File not found'
        });
      }

      const filePath = path.join(
        UPLOADS_DIR,
        file.fileId
      );

      if (!fsSync.existsSync(filePath)) {
        return res.status(404).json({
          error: 'File missing'
        });
      }

      const ext = path.extname(
        file.fileName
      ).toLowerCase();

      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png'
      };

      res.set(
        'Content-Type',
        mimeTypes[ext] ||
          'application/octet-stream'
      );

      res.set(
        'Content-Disposition',
        `inline; filename="${file.fileName}"`
      );

      res.sendFile(filePath);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Preview failed'
      });
    }
  }
);

// =========================
// DELETE FILE
// =========================
app.delete(
  '/api/files/:id/delete',
  async (req, res) => {
    try {
      const { id } = req.params;

      const files = await readFileData();

      const fileIndex = files.findIndex(
        (f) => f.id === id
      );

      if (fileIndex === -1) {
        return res.status(404).json({
          error: 'File not found'
        });
      }

      const file = files[fileIndex];

      const filePath = path.join(
        UPLOADS_DIR,
        file.fileId
      );

      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(error.message);
      }

      files.splice(fileIndex, 1);

      await writeFileData(files);

      res.json({
        success: true,
        message: 'File deleted'
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Delete failed'
      });
    }
  }
);

// =========================
// START SERVER
// =========================
async function startServer() {
  try {
    const PORT = await getPort({
      port: DEFAULT_PORT
    });

    const server = app.listen(
      PORT,
      '0.0.0.0',
      () => {
        const localIP = getLocalIP();

        console.log(
          `\n✅ Server running on port ${PORT}`
        );

        console.log(
          `🌐 Local: http://localhost:${PORT}`
        );

        console.log(
          `📱 Mobile: http://${localIP}:${PORT}`
        );

        console.log(
          `📁 Uploads: ${UPLOADS_DIR}`
        );

        console.log(
          `📄 Data file: ${DATA_FILE}\n`
        );
      }
    );

    server.on('error', (err) => {
      console.error(
        '❌ Server error:',
        err.message
      );
    });
  } catch (error) {
    console.error(
      'Failed to start server:',
      error
    );
  }
}

startServer();