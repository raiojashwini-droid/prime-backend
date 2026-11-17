const insuranceService = require('./insurance.service');

// POLICIES
async function listPolicies(req, res, next) {
  try {
    const list = await insuranceService.getAllPolicies();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

async function getPolicy(req, res, next) {
  try {
    const policy = await insuranceService.getPolicyById(req.params.id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        error: { message: `Policy #${req.params.id} not found`, code: 'NOT_FOUND' }
      });
    }
    return res.status(200).json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
}

async function createPolicy(req, res, next) {
  try {
    const created = await insuranceService.createPolicy(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

async function updatePolicy(req, res, next) {
  try {
    const updated = await insuranceService.updatePolicy(req.params.id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

async function deletePolicy(req, res, next) {
  try {
    const result = await insuranceService.deletePolicy(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// CLAIMS
async function listClaims(req, res, next) {
  try {
    const list = await insuranceService.getAllClaims();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

async function getClaim(req, res, next) {
  try {
    const claim = await insuranceService.getClaimById(req.params.id);
    if (!claim) {
      return res.status(404).json({
        success: false,
        error: { message: `Claim #${req.params.id} not found`, code: 'NOT_FOUND' }
      });
    }
    return res.status(200).json({ success: true, data: claim });
  } catch (error) {
    next(error);
  }
}

async function createClaim(req, res, next) {
  try {
    const created = await insuranceService.createClaim(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

async function updateClaim(req, res, next) {
  try {
    const updated = await insuranceService.updateClaim(req.params.id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

async function deleteClaim(req, res, next) {
  try {
    const result = await insuranceService.deleteClaim(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function listAccidents(req, res, next) {
  try {
    const list = await insuranceService.getAllAccidents();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

// COMPLIANCE
async function listCompliance(req, res, next) {
  try {
    const list = await insuranceService.getAllCompliance();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

async function createCompliance(req, res, next) {
  try {
    const created = await insuranceService.createCompliance(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

async function renewCompliance(req, res, next) {
  try {
    const updated = await insuranceService.renewCompliance(req.params.id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

async function deleteCompliance(req, res, next) {
  try {
    const result = await insuranceService.deleteCompliance(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// STATS
async function getStats(req, res, next) {
  try {
    const stats = await insuranceService.getInsuranceStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
  listClaims,
  getClaim,
  createClaim,
  updateClaim,
  deleteClaim,
  listAccidents,
  listCompliance,
  createCompliance,
  renewCompliance,
  deleteCompliance,
  getStats
};
