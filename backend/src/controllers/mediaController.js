const { ObjectId } = require('mongodb');
const { findMediaFile, openMediaDownloadStream } = require('../services/mediaStorage');

const streamMediaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    const mediaFile = await findMediaFile(id);
    if (!mediaFile) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    res.setHeader('Content-Type', mediaFile.contentType || mediaFile.metadata?.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', String(mediaFile.length));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const stream = openMediaDownloadStream(id);
    stream.on('error', next);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = { streamMediaById };