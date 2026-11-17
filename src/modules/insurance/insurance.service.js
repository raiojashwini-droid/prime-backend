const db = require('../../config/db');

function calculateDaysRemaining(expiryDate) {
  if (!expiryDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateComplianceStatus(daysRemaining) {
  if (daysRemaining <= 7) return 'Critical (≤7 days)';
  if (daysRemaining <= 14) return 'Due Soon (≤14 days)';
  if (daysRemaining <= 30) return 'Upcoming (≤30 days)';
  return 'Compliant (>30 days)';
}

function safeParseJson(data, fallback = null) {
  if (!data) return fallback;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

// -------------------------------------------------------------
// POLICIES
// -------------------------------------------------------------
async function getAllPolicies() {
  const rows = await db('insurance_policies').orderBy('id', 'desc');

  return rows.map((p) => {
    const daysRemaining = calculateDaysRemaining(p.expiry_date);
    return {
      id: p.id,
      policyId: `POL-${p.id}`,
      insurer: p.insurer_name,
      insurer_name: p.insurer_name,
      policyNumber: p.policy_number,
      policy_number: p.policy_number,
      coverage: p.coverage_details || p.coverage_type,
      coverageType: p.coverage_type,
      coverage_type: p.coverage_type,
      premium: Number(p.premium),
      deductible: p.deductible ? `$${Number(p.deductible).toLocaleString()}` : '$0',
      deductibleTerms: p.deductible ? `$${Number(p.deductible).toLocaleString()} Deductible` : '$0 Deductible',
      effectiveDate: p.effective_date ? new Date(p.effective_date).toISOString().split('T')[0] : '',
      expiryDate: p.expiry_date ? new Date(p.expiry_date).toISOString().split('T')[0] : '',
      daysRemaining: Math.max(0, daysRemaining),
      vehiclesCovered: p.vehicles_covered || 'All Fleet Vehicles',
      status: p.status === 'active' ? 'Active' : p.status === 'expired' ? 'Expired' : 'Cancelled',
      contacts: safeParseJson(p.contacts, { agentName: '', phone: '', email: '', broker: '' }),
      documents: safeParseJson(p.documents, []),
      createdAt: p.created_at,
      updatedAt: p.updated_at
    };
  });
}

async function getPolicyById(id) {
  const p = await db('insurance_policies').where({ id }).first();
  if (!p) return null;
  const daysRemaining = calculateDaysRemaining(p.expiry_date);

  return {
    id: p.id,
    policyId: `POL-${p.id}`,
    insurer: p.insurer_name,
    policyNumber: p.policy_number,
    coverage: p.coverage_details || p.coverage_type,
    coverageType: p.coverage_type,
    premium: Number(p.premium),
    deductible: `$${Number(p.deductible).toLocaleString()}`,
    effectiveDate: p.effective_date ? new Date(p.effective_date).toISOString().split('T')[0] : '',
    expiryDate: p.expiry_date ? new Date(p.expiry_date).toISOString().split('T')[0] : '',
    daysRemaining: Math.max(0, daysRemaining),
    vehiclesCovered: p.vehicles_covered || 'All Fleet Vehicles',
    status: p.status === 'active' ? 'Active' : p.status === 'expired' ? 'Expired' : 'Cancelled',
    contacts: safeParseJson(p.contacts, {}),
    documents: safeParseJson(p.documents, [])
  };
}

async function createPolicy(data) {
  const cleanPremium = typeof data.premium === 'string'
    ? parseFloat(data.premium.replace(/[^0-9.-]+/g, '')) || 0
    : Number(data.premium) || 0;

  const cleanDeductible = typeof data.deductible === 'string'
    ? parseFloat(data.deductible.replace(/[^0-9.-]+/g, '')) || 0
    : Number(data.deductible) || 0;

  const insertData = {
    policy_number: data.policyNumber || data.policy_number || `POL-${Date.now()}`,
    insurer_name: data.insurer || data.insurer_name || 'Standard Carrier',
    coverage_type: data.coverageType || data.coverage_type || 'Full Comprehensive & Liability',
    coverage_details: data.coverage || data.coverage_details || data.coverageType || '',
    premium: cleanPremium,
    deductible: cleanDeductible,
    effective_date: data.effectiveDate || data.effective_date || new Date().toISOString().split('T')[0],
    expiry_date: data.expiryDate || data.expiry_date || new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0],
    status: (data.status || 'Active').toLowerCase() === 'active' ? 'active' : 'expired',
    vehicles_covered: data.vehiclesCovered ? String(data.vehiclesCovered) : 'All Fleet Vehicles',
    contacts: data.contacts ? JSON.stringify(data.contacts) : null,
    documents: data.documents ? JSON.stringify(data.documents) : null
  };

  const [id] = await db('insurance_policies').insert(insertData);
  return getPolicyById(id);
}

async function updatePolicy(id, data) {
  const existing = await db('insurance_policies').where({ id }).first();
  if (!existing) {
    const error = new Error(`Policy #${id} not found`);
    error.status = 404;
    throw error;
  }

  const patch = {};
  if (data.policyNumber || data.policy_number) patch.policy_number = data.policyNumber || data.policy_number;
  if (data.insurer || data.insurer_name) patch.insurer_name = data.insurer || data.insurer_name;
  if (data.coverageType || data.coverage_type) patch.coverage_type = data.coverageType || data.coverage_type;
  if (data.coverage || data.coverage_details) patch.coverage_details = data.coverage || data.coverage_details;
  if (data.premium !== undefined) {
    patch.premium = typeof data.premium === 'string'
      ? parseFloat(data.premium.replace(/[^0-9.-]+/g, '')) || 0
      : Number(data.premium) || 0;
  }
  if (data.deductible !== undefined) {
    patch.deductible = typeof data.deductible === 'string'
      ? parseFloat(data.deductible.replace(/[^0-9.-]+/g, '')) || 0
      : Number(data.deductible) || 0;
  }
  if (data.effectiveDate || data.effective_date) patch.effective_date = data.effectiveDate || data.effective_date;
  if (data.expiryDate || data.expiry_date) patch.expiry_date = data.expiryDate || data.expiry_date;
  if (data.status) {
    patch.status = data.status.toLowerCase() === 'active' ? 'active' : data.status.toLowerCase() === 'expired' ? 'expired' : 'cancelled';
  }
  if (data.vehiclesCovered !== undefined) patch.vehicles_covered = String(data.vehiclesCovered);
  if (data.contacts !== undefined) patch.contacts = typeof data.contacts === 'string' ? data.contacts : JSON.stringify(data.contacts);
  if (data.documents !== undefined) patch.documents = typeof data.documents === 'string' ? data.documents : JSON.stringify(data.documents);

  patch.updated_at = db.fn.now();

  await db('insurance_policies').where({ id }).update(patch);
  return getPolicyById(id);
}

async function deletePolicy(id) {
  const existing = await db('insurance_policies').where({ id }).first();
  if (!existing) {
    const error = new Error(`Policy #${id} not found`);
    error.status = 404;
    throw error;
  }

  // Soft cancel or hard delete if no linked claims
  const linkedClaims = await db('insurance_claims').where({ policy_id: id }).count('id as cnt').first();
  if (linkedClaims && Number(linkedClaims.cnt) > 0) {
    // If claims exist, mark as cancelled rather than violating foreign key
    await db('insurance_policies').where({ id }).update({ status: 'cancelled', updated_at: db.fn.now() });
    return { id, message: 'Policy has active claims and was marked as Cancelled' };
  }

  await db('insurance_policies').where({ id }).del();
  return { id, message: 'Policy successfully deleted from database' };
}

// -------------------------------------------------------------
// CLAIMS
// -------------------------------------------------------------
async function getAllClaims() {
  const rows = await db('insurance_claims').orderBy('id', 'desc');

  return rows.map((c) => {
    let formattedStatus = 'Under Review';
    if (c.status === 'settled') formattedStatus = 'Settled';
    else if (c.status === 'approved') formattedStatus = 'Approved';
    else if (c.status === 'denied') formattedStatus = 'Denied';
    else if (c.status === 'submitted') formattedStatus = 'Submitted';
    else if (c.status === 'under_review') formattedStatus = 'Under Review';

    return {
      id: c.id,
      claimId: `CLM-${c.id}`,
      claimNumber: c.claim_number,
      policyId: c.policy_id ? `POL-${c.policy_id}` : 'POL-001',
      policyNumber: c.policy_number || 'TRV-CA-9821034-25',
      insurer: c.insurer || 'Travelers Commercial Auto & Marine',
      accidentId: c.accident_ref || (c.accident_id ? `ACC-${c.accident_id}` : 'ACC-PENDING'),
      incidentDate: c.claim_date ? new Date(c.claim_date).toISOString().split('T')[0] : '',
      vehicle: c.vehicle || 'Fleet Vehicle',
      plate: c.plate || 'PR-2024-FLEET',
      driver: c.driver || 'Assigned Driver',
      claimedAmount: Number(c.claim_amount) || 0,
      repairEstimate: Number(c.repair_estimate || c.claim_amount) || 0,
      repairInvoice: c.repair_invoice || '',
      repairInvoiceFile: c.repair_invoice_file || '',
      deductibleAmount: Number(c.deductible_applied) || 0,
      deductibleTerms: c.deductible_terms || `$${Number(c.deductible_applied || 1000).toLocaleString()} Deductible`,
      insurancePaid: Number(c.payout_amount) || 0,
      driverCharge: Number(c.driver_charge) || 0,
      amountRecovered: Number(c.amount_recovered) || 0,
      driverRecovered: Number(c.driver_recovered) || 0,
      status: formattedStatus,
      adjusterName: c.adjuster_name || '',
      adjusterPhone: c.adjuster_phone || '',
      notes: c.notes || '',
      createdAt: c.created_at,
      updatedAt: c.updated_at
    };
  });
}

async function getClaimById(id) {
  const c = await db('insurance_claims').where({ id }).first();
  if (!c) return null;

  let formattedStatus = 'Under Review';
  if (c.status === 'settled') formattedStatus = 'Settled';
  else if (c.status === 'approved') formattedStatus = 'Approved';
  else if (c.status === 'denied') formattedStatus = 'Denied';
  else if (c.status === 'submitted') formattedStatus = 'Submitted';
  else if (c.status === 'under_review') formattedStatus = 'Under Review';

  return {
    id: c.id,
    claimId: `CLM-${c.id}`,
    claimNumber: c.claim_number,
    policyId: c.policy_id ? `POL-${c.policy_id}` : 'POL-001',
    policyNumber: c.policy_number || '',
    insurer: c.insurer || '',
    accidentId: c.accident_ref || (c.accident_id ? `ACC-${c.accident_id}` : ''),
    incidentDate: c.claim_date ? new Date(c.claim_date).toISOString().split('T')[0] : '',
    vehicle: c.vehicle || '',
    plate: c.plate || '',
    driver: c.driver || '',
    claimedAmount: Number(c.claim_amount) || 0,
    repairEstimate: Number(c.repair_estimate || c.claim_amount) || 0,
    repairInvoice: c.repair_invoice || '',
    repairInvoiceFile: c.repair_invoice_file || '',
    deductibleAmount: Number(c.deductible_applied) || 0,
    deductibleTerms: c.deductible_terms || '',
    insurancePaid: Number(c.payout_amount) || 0,
    driverCharge: Number(c.driver_charge) || 0,
    amountRecovered: Number(c.amount_recovered) || 0,
    driverRecovered: Number(c.driver_recovered) || 0,
    status: formattedStatus,
    adjusterName: c.adjuster_name || '',
    adjusterPhone: c.adjuster_phone || '',
    notes: c.notes || ''
  };
}

async function createClaim(data) {
  const cleanClaimAmount = typeof data.claimedAmount === 'string'
    ? parseFloat(data.claimedAmount.replace(/[^0-9.-]+/g, '')) || 0
    : Number(data.claimedAmount || data.claim_amount || data.repairEstimate) || 0;

  const cleanPayout = typeof data.insurancePaid === 'string'
    ? parseFloat(data.insurancePaid.replace(/[^0-9.-]+/g, '')) || 0
    : Number(data.insurancePaid || data.payout_amount) || 0;

  const cleanDeductible = typeof data.deductibleAmount === 'string'
    ? parseFloat(data.deductibleAmount.replace(/[^0-9.-]+/g, '')) || 0
    : Number(data.deductibleAmount || data.deductible_applied) || 0;

  let dbStatus = 'submitted';
  const rawStatus = (data.status || '').toLowerCase().replace(/\s+/g, '_');
  if (['submitted', 'under_review', 'approved', 'denied', 'settled'].includes(rawStatus)) {
    dbStatus = rawStatus;
  } else if (rawStatus.includes('review')) {
    dbStatus = 'under_review';
  }

  // Find or default policy
  let polId = null;
  if (data.policyId) {
    const rawId = parseInt(String(data.policyId).replace(/[^0-9]/g, ''), 10);
    if (!isNaN(rawId)) polId = rawId;
  }
  if (!polId) {
    const firstPol = await db('insurance_policies').first();
    polId = firstPol ? firstPol.id : 1;
  }

  const insertData = {
    claim_number: data.claimNumber || `CLM-${Date.now()}`,
    policy_id: polId,
    accident_ref: data.accidentId || '',
    policy_number: data.policyNumber || '',
    insurer: data.insurer || '',
    claim_date: data.incidentDate || data.claim_date || new Date().toISOString().split('T')[0],
    claim_amount: cleanClaimAmount,
    payout_amount: cleanPayout,
    deductible_applied: cleanDeductible,
    status: dbStatus,
    notes: data.notes || '',
    vehicle: data.vehicle || '',
    plate: data.plate || '',
    driver: data.driver || '',
    repair_invoice: data.repairInvoice || '',
    repair_invoice_file: data.repairInvoiceFile || '',
    repair_estimate: Number(data.repairEstimate) || cleanClaimAmount,
    deductible_terms: data.deductibleTerms || '',
    driver_charge: Number(data.driverCharge) || 0,
    driver_recovered: Number(data.driverRecovered) || 0,
    amount_recovered: Number(data.amountRecovered) || 0,
    adjuster_name: data.adjusterName || '',
    adjuster_phone: data.adjusterPhone || ''
  };

  const [id] = await db('insurance_claims').insert(insertData);
  return getClaimById(id);
}

async function updateClaim(id, data) {
  const existing = await db('insurance_claims').where({ id }).first();
  if (!existing) {
    const error = new Error(`Claim #${id} not found`);
    error.status = 404;
    throw error;
  }

  const patch = {};
  if (data.claimNumber) patch.claim_number = data.claimNumber;
  if (data.accidentId !== undefined) patch.accident_ref = data.accidentId;
  if (data.policyNumber !== undefined) patch.policy_number = data.policyNumber;
  if (data.insurer !== undefined) patch.insurer = data.insurer;
  if (data.incidentDate) patch.claim_date = data.incidentDate;
  if (data.vehicle !== undefined) patch.vehicle = data.vehicle;
  if (data.plate !== undefined) patch.plate = data.plate;
  if (data.driver !== undefined) patch.driver = data.driver;
  if (data.claimedAmount !== undefined) {
    patch.claim_amount = typeof data.claimedAmount === 'string'
      ? parseFloat(data.claimedAmount.replace(/[^0-9.-]+/g, '')) || 0
      : Number(data.claimedAmount) || 0;
  }
  if (data.repairEstimate !== undefined) {
    patch.repair_estimate = typeof data.repairEstimate === 'string'
      ? parseFloat(data.repairEstimate.replace(/[^0-9.-]+/g, '')) || 0
      : Number(data.repairEstimate) || 0;
  }
  if (data.insurancePaid !== undefined) {
    patch.payout_amount = typeof data.insurancePaid === 'string'
      ? parseFloat(data.insurancePaid.replace(/[^0-9.-]+/g, '')) || 0
      : Number(data.insurancePaid) || 0;
  }
  if (data.deductibleAmount !== undefined) {
    patch.deductible_applied = typeof data.deductibleAmount === 'string'
      ? parseFloat(data.deductibleAmount.replace(/[^0-9.-]+/g, '')) || 0
      : Number(data.deductibleAmount) || 0;
  }
  if (data.driverCharge !== undefined) patch.driver_charge = Number(data.driverCharge) || 0;
  if (data.driverRecovered !== undefined) patch.driver_recovered = Number(data.driverRecovered) || 0;
  if (data.amountRecovered !== undefined) patch.amount_recovered = Number(data.amountRecovered) || 0;
  if (data.repairInvoice !== undefined) patch.repair_invoice = data.repairInvoice;
  if (data.repairInvoiceFile !== undefined) patch.repair_invoice_file = data.repairInvoiceFile;
  if (data.deductibleTerms !== undefined) patch.deductible_terms = data.deductibleTerms;
  if (data.adjusterName !== undefined) patch.adjuster_name = data.adjusterName;
  if (data.adjusterPhone !== undefined) patch.adjuster_phone = data.adjusterPhone;
  if (data.notes !== undefined) patch.notes = data.notes;

  if (data.status) {
    const raw = data.status.toLowerCase().replace(/\s+/g, '_');
    if (['submitted', 'under_review', 'approved', 'denied', 'settled'].includes(raw)) {
      patch.status = raw;
    } else if (raw.includes('review')) {
      patch.status = 'under_review';
    }
  }

  patch.updated_at = db.fn.now();

  await db('insurance_claims').where({ id }).update(patch);
  return getClaimById(id);
}

async function deleteClaim(id) {
  const existing = await db('insurance_claims').where({ id }).first();
  if (!existing) {
    const error = new Error(`Claim #${id} not found`);
    error.status = 404;
    throw error;
  }

  await db('insurance_claims').where({ id }).del();
  return { id, message: 'Claim record successfully deleted' };
}

// -------------------------------------------------------------
// ACCIDENTS (FOR CLAIM LINKING)
// -------------------------------------------------------------
async function getAllAccidents() {
  const rows = await db('accidents')
    .leftJoin('vehicles', 'accidents.vehicle_id', 'vehicles.id')
    .leftJoin('drivers', 'accidents.driver_id', 'drivers.id')
    .select(
      'accidents.id',
      'accidents.accident_date',
      'accidents.location',
      'accidents.description',
      'accidents.police_report_no',
      'accidents.estimated_damage',
      'accidents.status',
      'vehicles.plate as vehicle_plate',
      'vehicles.make as vehicle_make',
      'vehicles.model as vehicle_model',
      db.raw("CONCAT(COALESCE(drivers.first_name, ''), ' ', COALESCE(drivers.last_name, '')) as driver_name")
    )
    .orderBy('accidents.id', 'desc');

  return rows.map((a) => ({
    id: `ACC-${String(a.id).padStart(3, '0')}`,
    rawId: a.id,
    date: a.accident_date ? new Date(a.accident_date).toISOString().split('T')[0] : '',
    incidentDate: a.accident_date ? new Date(a.accident_date).toISOString().split('T')[0] : '',
    location: a.location || '',
    description: a.description || '',
    vehicle: a.vehicle_make && a.vehicle_model ? `${a.vehicle_make} ${a.vehicle_model}` : 'Toyota Camry SE',
    plate: a.vehicle_plate || 'PR-2024-TC',
    driver: (a.driver_name && a.driver_name.trim()) || 'Marcus Vance',
    repairEstimate: Number(a.estimated_damage) || 0,
    status: a.status
  }));
}

// -------------------------------------------------------------
// COMPLIANCE RECORDS
// -------------------------------------------------------------
async function getAllCompliance() {
  const rows = await db('compliance_records').orderBy('expiry_date', 'asc');

  return rows.map((c) => {
    const daysRemaining = calculateDaysRemaining(c.expiry_date);
    const dynamicStatus = calculateComplianceStatus(daysRemaining);

    return {
      id: c.id,
      complianceId: `CMP-${c.id}`,
      category: c.category,
      title: c.title,
      entityType: c.entity_type,
      entity_type: c.entity_type,
      entityName: c.entity_name,
      entity_name: c.entity_name,
      entityId: c.entity_id,
      entity_id: c.entity_id,
      identifier: c.identifier || `REF-${c.id}`,
      authority: c.authority,
      expiryDate: c.expiry_date ? new Date(c.expiry_date).toISOString().split('T')[0] : '',
      expiry_date: c.expiry_date,
      daysRemaining: Math.max(0, daysRemaining),
      documentFile: c.document_file || 'compliance_document.pdf',
      status: dynamicStatus,
      notes: c.notes || ''
    };
  });
}

async function createCompliance(data) {
  const expiryDate = data.expiryDate || data.expiry_date || new Date().toISOString().split('T')[0];
  const daysRemaining = calculateDaysRemaining(expiryDate);
  const status = calculateComplianceStatus(daysRemaining);

  const insertData = {
    category: data.category || 'Vehicle Registration',
    title: data.title || 'Regulatory Document',
    entity_type: data.entityType || data.entity_type || 'Vehicle',
    entity_name: data.entityName || data.entity_name || '',
    entity_id: data.entityId || data.entity_id || '',
    identifier: data.identifier || '',
    authority: data.authority || '',
    expiry_date: expiryDate,
    document_file: data.documentFile || data.document_file || '',
    status: status,
    notes: data.notes || ''
  };

  const [id] = await db('compliance_records').insert(insertData);
  const c = await db('compliance_records').where({ id }).first();
  return {
    id: c.id,
    complianceId: `CMP-${c.id}`,
    category: c.category,
    title: c.title,
    entityType: c.entity_type,
    entityName: c.entity_name,
    identifier: c.identifier,
    authority: c.authority,
    expiryDate: c.expiry_date ? new Date(c.expiry_date).toISOString().split('T')[0] : '',
    daysRemaining: Math.max(0, daysRemaining),
    documentFile: c.document_file,
    status,
    notes: c.notes
  };
}

async function renewCompliance(id, data) {
  const existing = await db('compliance_records').where({ id }).first();
  if (!existing) {
    const error = new Error(`Compliance record #${id} not found`);
    error.status = 404;
    throw error;
  }

  const newExpiry = data.expiryDate || data.expiry_date || new Date().toISOString().split('T')[0];
  const daysRemaining = calculateDaysRemaining(newExpiry);
  const status = calculateComplianceStatus(daysRemaining);

  const patch = {
    expiry_date: newExpiry,
    status,
    updated_at: db.fn.now()
  };

  if (data.notes !== undefined) patch.notes = data.notes;
  if (data.authority !== undefined) patch.authority = data.authority;
  if (data.documentFile !== undefined) patch.document_file = data.documentFile;

  await db('compliance_records').where({ id }).update(patch);

  const updated = await db('compliance_records').where({ id }).first();
  return {
    id: updated.id,
    category: updated.category,
    title: updated.title,
    entityType: updated.entity_type,
    entityName: updated.entity_name,
    identifier: updated.identifier,
    authority: updated.authority,
    expiryDate: updated.expiry_date ? new Date(updated.expiry_date).toISOString().split('T')[0] : '',
    daysRemaining: Math.max(0, daysRemaining),
    documentFile: updated.document_file,
    status,
    notes: updated.notes
  };
}

async function deleteCompliance(id) {
  const existing = await db('compliance_records').where({ id }).first();
  if (!existing) {
    const error = new Error(`Compliance record #${id} not found`);
    error.status = 404;
    throw error;
  }

  await db('compliance_records').where({ id }).del();
  return { id, message: 'Compliance record deleted' };
}

// -------------------------------------------------------------
// STATS / METRICS
// -------------------------------------------------------------
async function getInsuranceStats() {
  const compliance = await getAllCompliance();
  const policies = await getAllPolicies();
  const claims = await getAllClaims();

  const criticalCount = compliance.filter((c) => c.daysRemaining <= 7).length;
  const dueSoonCount = compliance.filter((c) => c.daysRemaining > 7 && c.daysRemaining <= 14).length;
  const upcomingCount = compliance.filter((c) => c.daysRemaining > 14 && c.daysRemaining <= 30).length;
  const openClaimsCount = claims.filter((c) => c.status !== 'Settled').length;
  const totalPremium = policies
    .filter((p) => p.status === 'Active')
    .reduce((sum, p) => sum + (Number(p.premium) || 0), 0);

  return {
    totalCompliance: compliance.length,
    criticalCount,
    dueSoonCount,
    upcomingCount,
    totalPremium,
    openClaimsCount,
    totalPolicies: policies.length
  };
}

module.exports = {
  // Policies
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  // Claims
  getAllClaims,
  getClaimById,
  createClaim,
  updateClaim,
  deleteClaim,
  getAllAccidents,
  // Compliance
  getAllCompliance,
  createCompliance,
  renewCompliance,
  deleteCompliance,
  // Stats
  getInsuranceStats
};
