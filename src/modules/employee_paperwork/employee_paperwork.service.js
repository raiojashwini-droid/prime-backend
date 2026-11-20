const db = require('../../config/db');

/**
 * Format paperwork record for frontend
 */
function formatPaperwork(row) {
  if (!row) return null;

  let formData = {};
  try {
    formData = typeof row.form_data === 'string'
      ? JSON.parse(row.form_data)
      : (row.form_data || {});
  } catch (e) {
    formData = {};
  }

  let emergency = {};
  try {
    emergency = typeof row.emergency_contact === 'string'
      ? JSON.parse(row.emergency_contact)
      : (row.emergency_contact || {});
  } catch (e) {}

  let directDeposit = {};
  try {
    directDeposit = typeof row.direct_deposit_details === 'string'
      ? JSON.parse(row.direct_deposit_details)
      : (row.direct_deposit_details || {});
  } catch (e) {}

  const statusMap = {
    not_started: 'Not Started',
    draft: 'Draft',
    submitted: 'Pending Review',
    under_review: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  const personalData = formData.personal || {};
  const employmentData = formData.employment || {};
  const documentsData = formData.documents || {};
  const agreementsData = formData.agreements || {};

  return {
    id: row.id,
    submissionId: `PR-SUB-2026-${String(row.id).padStart(4, '0')}`,
    userId: row.user_id,
    driverId: row.driver_id,
    fullName: row.full_name,
    status: statusMap[row.status] || row.status || 'Pending Review',
    rawStatus: row.status,
    submittedAt: row.submitted_at,
    lastUpdated: row.updated_at,
    reviewedBy: row.reviewed_by,
    reviewNotes: row.review_notes || '',
    signature: row.signature_url,
    personal: {
      firstName: personalData.firstName || row.full_name?.split(' ')[0] || '',
      lastName: personalData.lastName || row.full_name?.split(' ').slice(1).join(' ') || '',
      email: personalData.email || '',
      phone: personalData.phone || row.phone || '',
      dob: personalData.dob || (row.dob ? new Date(row.dob).toISOString().split('T')[0] : ''),
      address: personalData.address || row.address || '',
      city: personalData.city || '',
      state: personalData.state || '',
      zipCode: personalData.zipCode || personalData.zip || '',
      emergencyContactName: personalData.emergencyContactName || personalData.emergencyName || emergency.name || '',
      emergencyContactPhone: personalData.emergencyContactPhone || personalData.emergencyPhone || emergency.phone || ''
    },
    employment: {
      employeeId: employmentData.employeeId || 'PR-EMP-2026-01',
      position: employmentData.position || '',
      department: employmentData.department || '',
      employmentType: employmentData.employmentType || 'Full-Time (W-2)',
      joiningDate: employmentData.joiningDate || employmentData.startDate || '',
      assignedManager: employmentData.assignedManager || employmentData.manager || ''
    },
    documents: {
      governmentId: documentsData.governmentId || null,
      drivingLicense: documentsData.drivingLicense || documentsData.driversLicense || null,
      taxDocuments: documentsData.taxDocuments || documentsData.w4Form || null,
      bankDetails: documentsData.bankDetails || documentsData.directDepositVoidCheck || null,
      otherDocuments: documentsData.otherDocuments || null
    },
    agreements: {
      codeOfConduct: agreementsData.codeOfConduct !== undefined ? agreementsData.codeOfConduct : false,
      safetyPolicy: agreementsData.safetyPolicy !== undefined ? agreementsData.safetyPolicy : false,
      digitalSignature: agreementsData.digitalSignature || row.signature_url || null,
      acceptedTerms: agreementsData.acceptedTerms !== undefined ? agreementsData.acceptedTerms : false
    }
  };
}

/**
 * Get active employee paperwork record
 */
async function getActivePaperwork(userId = null) {
  let row = null;
  if (userId) {
    row = await db('employee_paperwork').where({ user_id: userId }).orderBy('id', 'desc').first().catch(() => null);
  }
  if (!row) {
    row = await db('employee_paperwork').orderBy('id', 'desc').first().catch(() => null);
  }

  // If table is empty, auto-create clean blank baseline row
  if (!row) {
    row = await savePaperwork({
      status: 'not_started',
      personal: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dob: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        emergencyContactName: '',
        emergencyContactPhone: ''
      },
      employment: {
        employeeId: 'PR-EMP-2026-01',
        position: '',
        department: '',
        employmentType: 'Full-Time (W-2)',
        joiningDate: '',
        assignedManager: ''
      },
      documents: {
        governmentId: null,
        drivingLicense: null,
        taxDocuments: null,
        bankDetails: null,
        otherDocuments: null
      },
      agreements: {
        codeOfConduct: false,
        safetyPolicy: false,
        digitalSignature: null,
        acceptedTerms: false
      }
    }, userId);
    return row;
  }

  return formatPaperwork(row);
}

/**
 * Get paperwork by ID
 */
async function getPaperworkById(id) {
  let cleanId = id;
  if (typeof id === 'string' && id.includes('PR-SUB-')) {
    cleanId = parseInt(id.replace(/[^0-9]/g, ''), 10);
  }
  let row = await db('employee_paperwork').where({ id: cleanId }).first().catch(() => null);
  if (!row) {
    row = await db('employee_paperwork').orderBy('id', 'desc').first().catch(() => null);
  }
  if (!row) {
    const err = new Error(`Paperwork #${id} not found`);
    err.status = 404;
    throw err;
  }
  return formatPaperwork(row);
}

/**
 * Save / Submit paperwork
 */
async function savePaperwork(payload, userId = null) {
  // 1. Verify user_id foreign key safely
  let validUserId = null;
  if (userId) {
    const u = await db('users').where({ id: userId }).first().catch(() => null);
    if (u) validUserId = userId;
  }
  if (!validUserId) {
    const firstU = await db('users').first().catch(() => null);
    if (firstU) validUserId = firstU.id;
  }

  // 2. Verify driver_id foreign key safely
  let validDriverId = null;
  if (payload.driverId) {
    const d = await db('drivers').where({ id: payload.driverId }).first().catch(() => null);
    if (d) validDriverId = payload.driverId;
  }
  if (!validDriverId) {
    const firstD = await db('drivers').first().catch(() => null);
    if (firstD) validDriverId = firstD.id;
  }

  // 3. Find existing record to update
  let existing = null;
  if (payload.id) {
    existing = await db('employee_paperwork').where({ id: payload.id }).first().catch(() => null);
  }
  if (!existing && validUserId) {
    existing = await db('employee_paperwork').where({ user_id: validUserId }).first().catch(() => null);
  }
  if (!existing) {
    existing = await db('employee_paperwork').orderBy('id', 'desc').first().catch(() => null);
  }

  const fullName = payload.personal
    ? `${payload.personal.firstName || ''} ${payload.personal.lastName || ''}`.trim()
    : (payload.fullName || 'David Miller');

  const ssnLast4 = payload.personal?.ssnLast4 || '4829';
  const phone = payload.personal?.phone || '+1 (555) 349-1029';
  const address = payload.personal?.address || '742 Evergreen Terrace';
  const dob = payload.personal?.dob || '1992-06-14';

  const statusInput = (payload.status || 'submitted').toLowerCase().replace(' ', '_');
  const validStatuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'not_started'];
  const dbStatus = validStatuses.includes(statusInput)
    ? statusInput
    : (statusInput === 'pending_review' ? 'submitted' : 'submitted');

  const rowData = {
    user_id: validUserId,
    driver_id: validDriverId,
    full_name: fullName,
    ssn_last4: String(ssnLast4).slice(-4),
    dob: dob,
    address: address,
    phone: phone,
    emergency_contact: JSON.stringify(payload.personal ? {
      name: payload.personal.emergencyContactName || payload.personal.emergencyName || 'Sarah Miller',
      phone: payload.personal.emergencyContactPhone || payload.personal.emergencyPhone || '+1 (555) 902-4821',
      relation: payload.personal.emergencyRelation || 'Spouse'
    } : {}),
    direct_deposit_details: JSON.stringify(payload.employment ? {
      bank: payload.employment.bankName || 'Chase Commercial',
      routing: payload.employment.routingNumber || '••••4812',
      account: payload.employment.accountNumber || '••••••••8819'
    } : {}),
    status: dbStatus,
    submitted_at: dbStatus === 'submitted' ? db.fn.now() : (existing?.submitted_at || null),
    signature_url: payload.agreements?.digitalSignature || payload.signature || fullName,
    form_data: JSON.stringify(payload),
    updated_at: db.fn.now()
  };

  if (payload.reviewNotes !== undefined) {
    rowData.review_notes = payload.reviewNotes;
  }
  if (payload.reviewedBy !== undefined) {
    rowData.reviewed_by = payload.reviewedBy;
  }

  if (existing) {
    await db('employee_paperwork').where({ id: existing.id }).update(rowData);
    return getPaperworkById(existing.id);
  } else {
    rowData.created_at = db.fn.now();
    const [newId] = await db('employee_paperwork').insert(rowData);
    return getPaperworkById(newId);
  }
}

/**
 * Review paperwork (Approve or Reject or Reset)
 */
async function reviewPaperwork(id, action, notes = '', reviewerId = 1) {
  let cleanId = id;
  if (typeof id === 'string' && id.includes('PR-SUB-')) {
    cleanId = parseInt(id.replace(/[^0-9]/g, ''), 10);
  }
  let existing = null;
  if (cleanId && cleanId !== 'undefined' && cleanId !== 'null') {
    existing = await db('employee_paperwork').where({ id: cleanId }).first().catch(() => null);
  }
  if (!existing) {
    existing = await db('employee_paperwork').orderBy('id', 'desc').first().catch(() => null);
  }
  if (!existing) {
    existing = await savePaperwork({ status: 'submitted' });
  }

  let nextStatus = 'approved';
  const act = (action || '').toLowerCase();
  if (act === 'reject') {
    nextStatus = 'rejected';
  } else if (act === 'reset') {
    nextStatus = 'not_started';
  } else if (act === 'draft') {
    nextStatus = 'draft';
  } else if (act === 'not_started') {
    nextStatus = 'not_started';
  } else if (act === 'submit' || act === 'submitted' || act === 'pending_review') {
    nextStatus = 'submitted';
  }

  let validReviewerId = null;
  if (reviewerId) {
    const revUser = await db('users').where({ id: reviewerId }).first().catch(() => null);
    if (revUser) validReviewerId = revUser.id;
  }

  const updateFields = {
    status: nextStatus,
    reviewed_by: validReviewerId,
    review_notes: notes || (nextStatus === 'approved' ? 'Approved by Admin' : nextStatus === 'rejected' ? 'Changes requested' : ''),
    updated_at: db.fn.now()
  };

  if (act === 'reset') {
    updateFields.form_data = JSON.stringify({});
    updateFields.full_name = '';
    updateFields.signature_url = null;
    updateFields.review_notes = '';
    updateFields.submitted_at = null;
  }

  await db('employee_paperwork').where({ id: existing.id }).update(updateFields);

  // When approved, if linked to a driver, ensure driver status is active
  if (nextStatus === 'approved' && existing.driver_id) {
    await db('drivers').where({ id: existing.driver_id }).update({ status: 'Active' }).catch(() => {});
  }

  return getPaperworkById(existing.id);
}

module.exports = {
  getActivePaperwork,
  getPaperworkById,
  savePaperwork,
  reviewPaperwork
};
