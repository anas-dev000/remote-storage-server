import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import BaseUploadProvider from './BaseUploadProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LocalProvider extends BaseUploadProvider {
  constructor() {
    super();
    this.uploadDir = process.env.LOCAL_UPLOAD_PATH || 'uploads';
    this.baseUrl = process.env.STORAGE_SERVER_URL || `http://localhost:${process.env.STORAGE_PORT || 5001}`;
    
    // Resolved base directory (project root)
    this.basePath = path.resolve(__dirname, '../../');
    const fullUploadPath = path.join(this.basePath, this.uploadDir);
    
    if (!existsSync(fullUploadPath)) {
      mkdirSync(fullUploadPath, { recursive: true });
    }
  }

  generateFilename(originalFilename, extension) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedName = originalFilename
      ? originalFilename.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
      : 'file';
    return `${sanitizedName}-${timestamp}-${randomString}${extension}`;
  }

  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async upload(buffer, options = {}) {
    const { folder = 'general', mimetype, filename } = options;

    const isImage = mimetype.startsWith('image/') && !this.isPdf(mimetype);
    const isVideo = mimetype.startsWith('video/');
    const isAudio = mimetype.startsWith('audio/');
    const isPdf = this.isPdf(mimetype);

    const folderPath = path.join(this.basePath, this.uploadDir, folder);
    await this.ensureDir(folderPath);

    let savedFilename;
    let processedBuffer = buffer;
    let metadata = {};

    if (isImage) {
      const result = await this.processImage(buffer);
      processedBuffer = result.buffer;
      savedFilename = this.generateFilename(filename, '.webp');
      metadata = { width: result.width, height: result.height, format: 'webp', resourceType: 'image' };
    } else if (isVideo) {
      const ext = this.getExtensionFromMimetype(mimetype);
      savedFilename = this.generateFilename(filename, ext);
      metadata = { format: ext.replace('.', ''), resourceType: 'video' };
    } else if (isAudio) {
      const ext = this.getExtensionFromMimetype(mimetype);
      savedFilename = this.generateFilename(filename, ext);
      metadata = { format: ext.replace('.', ''), resourceType: 'video' };
    } else if (isPdf) {
      savedFilename = this.generateFilename(filename, '.pdf');
      metadata = { format: 'pdf', resourceType: 'raw' };
    } else {
      const ext = this.getExtensionFromMimetype(mimetype);
      savedFilename = this.generateFilename(filename, ext);
      metadata = { format: ext.replace('.', ''), resourceType: 'raw' };
    }

    const filePath = path.join(folderPath, savedFilename);
    await fs.writeFile(filePath, processedBuffer);

    const publicId = `${folder}/${savedFilename}`;
    const url = `${this.baseUrl}/${this.uploadDir}/${folder}/${savedFilename}`;

    return {
      url,
      publicId,
      resourceType: metadata.resourceType,
      format: metadata.format,
      width: metadata.width || null,
      height: metadata.height || null,
      bytes: processedBuffer.length,
      provider: 'local'
    };
  }

  async processImage(buffer) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      let processedImage = image;
      if (metadata.width > 1280) {
        processedImage = image.resize(1280, null, { fit: 'inside', withoutEnlargement: true });
      }
      const outputBuffer = await processedImage.webp({ quality: 80 }).toBuffer();
      const finalMetadata = await sharp(outputBuffer).metadata();
      return { buffer: outputBuffer, width: finalMetadata.width, height: finalMetadata.height };
    } catch (error) {
      return { buffer, width: null, height: null };
    }
  }

  async delete(publicId) {
    try {
      const filePath = path.join(this.basePath, this.uploadDir, publicId);
      await fs.access(filePath);
      await fs.unlink(filePath);
      return true;
    } catch {
      return true;
    }
  }

  getExtensionFromMimetype(mimetype) {
    const mimeToExt = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
      'video/mp4': '.mp4', 'video/webm': '.webm', 'audio/mpeg': '.mp3', 'application/pdf': '.pdf',
    };
    return mimeToExt[mimetype] || '.bin';
  }
}

export default LocalProvider;
