const paperworkService = require('./employee_paperwork.service');

async function getPaperwork(req, res, next) {
  try {
    const data = await paperworkService.getActivePaperwork(req.user?.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getPaperworkById(req, res, next) {
  try {
    const data = await paperworkService.getPaperworkById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function savePaperwork(req, res, next) {
  try {
    const data = await paperworkService.savePaperwork(req.body, req.user?.id || 1);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function reviewPaperwork(req, res, next) {
  try {
    const { action, notes } = req.body;
    const data = await paperworkService.reviewPaperwork(req.params.id, action, notes, req.user?.id || 1);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPaperwork,
  getPaperworkById,
  savePaperwork,
  reviewPaperwork
};
