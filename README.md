# Remote Storage Server

A standalone Node.js storage backend for handling file uploads, local disk storage, and public file serving.
Designed to be used as a **remote storage service** alongside a main backend (e.g. deployed on Render),
while utilizing persistent disk storage on platforms like **Hostinger**.

---

## 🚀 Overview

This project provides a **dedicated storage server** that:

- Accepts file uploads via HTTP
- Stores files on local disk (persistent storage)
- Optimizes images (compression + WebP conversion)
- Serves files publicly
- Deletes files on request
- Secures all write operations using an API Key

It is intended to be used as a **separate service** from the main application backend.

---

## 🧱 Architecture

```

Frontend
↓
Core Backend (Render)
↓  HTTP (API Key secured)
Remote Storage Server (Hostinger)
↓
Local Disk (uploads/)

```

### Responsibilities

### Core Backend (NOT included here)
- Authentication & authorization
- Business logic
- Database access (MongoDB)
- File metadata persistence (URL, publicId)

### Storage Server (this project)
- File upload & deletion
- Local disk storage
- Image optimization
- Public file access
- NO database access
- NO business logic

---

## 📁 Project Structure

```

storage-backend/
├── src/
│   └── providers/
│       ├── BaseUploadProvider.js
│       └── LocalProvider.js
├── uploads/                # Stored files
├── .env.example
├── package.json
└── storage-server.js       # Express entry point

````

---

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=5001
STORAGE_SERVER_API_KEY=your_secure_api_key
LOCAL_UPLOAD_PATH=uploads
````

---

## 📦 Installation

```bash
npm install
```

---

## ▶️ Running the Server

```bash
npm start
```

The server will start on:

```
http://localhost:5001
```

---

## 🔐 Security

All **write operations** (upload & delete) are protected using an API Key.

### Required Header

```
X-API-KEY: your_secure_api_key
```

Requests without a valid API key will be rejected.

---

## 📤 Upload File

### Endpoint

```
POST /upload
```

### Headers

```
X-API-KEY: your_secure_api_key
```

### Body (multipart/form-data)

* `file` (required): The file to upload
* `folder` (optional): Target subfolder (default: `general`)

### Response

```json
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/uploads/general/file.webp",
    "publicId": "general/file.webp",
    "resourceType": "image",
    "format": "webp"
  }
}
```

---

## 🗑️ Delete File

### Endpoint

```
DELETE /delete/:publicId
```

### Headers

```
X-API-KEY: your_secure_api_key
```

### Example

```
DELETE /delete/general/file.webp
```

---

## 🌍 Public File Access

Uploaded files are publicly accessible via:

```
/uploads/<folder>/<filename>
```

Example:

```
https://storage.example.com/uploads/general/image.webp
```

---

## 🧪 Testing

### Health Check

```
GET /health
```

Expected response:

```json
{ "status": "OK" }
```

### Manual Testing

* Upload a file using Postman or curl
* Verify file appears in `uploads/`
* Open file URL in browser
* Delete file and verify removal

---

## ☁️ Deployment (Hostinger)

1. Upload this project to your Hostinger server
2. Set environment variables
3. Install dependencies
4. Run:

```bash
node storage-server.js
```

Or using a process manager like `pm2` (recommended).

---

## 🔗 Integration with Core Backend

This server is designed to work with a main backend using an HTTP-based storage provider
(e.g. `HttpStorageProvider`).

The Core Backend:

* Sends files to this server
* Receives URLs & publicIds
* Stores metadata in its own database

---

## 🛑 Important Notes

* This service should **NOT** access any database
* This service should **NOT** contain business logic
* This service is stateless except for stored files
* Designed for small to medium scale projects

---