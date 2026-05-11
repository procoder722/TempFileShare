# TempFileShare

TempFileShare is a secure temporary file sharing platform that allows users to transfer files between devices using password protection, download limits, and temporary access links.

## Problem Statement

Transferring files between desktop and mobile devices is still inconvenient for many users. People often rely on USB cables, messaging apps, Bluetooth, or permanent cloud storage links just to send a single file from one device to another.

Most existing solutions are either:
- slow,
- insecure,
- dependent on accounts,
- or lack temporary access control.

Users need a simple platform where files can be:
- transferred instantly between devices
- shared securely
- protected with passwords
- limited to specific download counts
- automatically expired after usage

## Solution

TempFileShare provides secure temporary file transfer through shareable links with customizable access controls.

A user can:
- upload a file
- set a password
- choose download limits
- generate a temporary link
- access the file from any device

The file becomes inaccessible once the limit or expiry condition is reached.

## Features

- Desktop to mobile file transfer
- Mobile to desktop transfer
- Password protected file sharing
- Limited download access
- Temporary share links
- Fast upload and download
- Responsive UI
- Simple and clean workflow

## Use Cases

### Cross Device File Transfer
Transfer files between desktop, laptop, and mobile devices without cables or third-party apps.

### Secure Sharing
Share sensitive documents with password protection and controlled access.

### Temporary File Delivery
Send files that automatically expire after a limited number of downloads.

### Student and Team Collaboration
Quickly share notes, assignments, reports, and project files.

## Tech Stack

### Frontend
- React.js / Next.js
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB / Firebase

### Storage
- Cloudinary / AWS S3

## How It Works

1. Upload a file
2. Set password and download limit
3. Generate a temporary secure link
4. Share the link
5. Receiver downloads the file securely

## Future Improvements

- QR code transfer
- End-to-end encryption
- File expiry timer
- Multi-file upload
- Real-time transfer status
- Peer-to-peer transfer



npm install

npm run dev
