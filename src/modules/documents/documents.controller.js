const documentsService = require('./documents.service');

async function listDocuments(req, res, next) {
  try {
    const list = await documentsService.getAllDocuments();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

async function getDocument(req, res, next) {
  try {
    const doc = await documentsService.getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: { message: 'Document not found' } });
    }
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
}

async function createDocument(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const created = await documentsService.createDocument(req.body, userId);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

async function deleteDocument(req, res, next) {
  try {
    const result = await documentsService.deleteDocument(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listDocuments,
  getDocument,
  createDocument,
  deleteDocument
};
