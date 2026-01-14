class BaseUploadProvider {
  constructor() {
    if (new.target === BaseUploadProvider) {
      throw new Error('BaseUploadProvider is abstract');
    }
  }

  async upload(buffer, options) {
    throw new Error('upload() must be implemented');
  }

  async delete(publicId, resourceType = 'image') {
    throw new Error('delete() must be implemented');
  }

  getUrl(publicId, options = {}) {
    throw new Error('getUrl() must be implemented');
  }

  getResourceType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'video';
    return 'raw';
  }

  isPdf(mimetype) {
    return [
      'application/pdf',
      'application/x-pdf',
      'application/acrobat',
      'application/vnd.pdf',
      'text/pdf'
    ].includes(mimetype);
  }
}

export default BaseUploadProvider;
