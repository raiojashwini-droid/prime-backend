const auditService = require('./audit.service');

async function getAuditLogs(req, res, next) {
  try {
    const {
      page,
      limit,
      user,
      userId,
      action,
      module: mod,
      datePeriod,
      search,
      sortBy,
      sortOrder
    } = req.query;

    const result = await auditService.getAuditLogs({
      page,
      limit,
      user,
      userId,
      action,
      module: mod,
      datePeriod,
      search,
      sortBy,
      sortOrder
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function createAuditLog(req, res, next) {
  try {
    const {
      module: mod,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      notes,
      record
    } = req.body;

    const userId = req.user?.id || req.body.userId;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await auditService.createAuditLog({
      userId,
      module: mod,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      notes,
      record,
      ipAddress,
      userAgent
    });

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function exportAuditLogs(req, res, next) {
  try {
    const { user, userId, action, module: mod, datePeriod, search } = req.query;

    const result = await auditService.getAuditLogs({
      page: 1,
      limit: 1000,
      user,
      userId,
      action,
      module: mod,
      datePeriod,
      search
    });

    return res.status(200).json({
      success: true,
      data: result.logs
    });
  } catch (error) {
    next(error);
  }
}

async function getFilters(req, res, next) {
  try {
    const data = await auditService.getAuditFiltersMetadata();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditLogs,
  createAuditLog,
  exportAuditLogs,
  getFilters
};
