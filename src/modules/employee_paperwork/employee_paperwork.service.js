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
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  return {
    id: row.id,
    submissionId: `PR-SUB-2026-${String(row.id).padStart(4, '0')}`,
    userId: row.user_id,
    driverId: row.driver_id,
    fullName: row.full_name,
    status: statusMap[row.status] || row.status || 'Submitted',
    rawStatus: row.status,
    submittedAt: row.submitted_at,
    lastUpdated: row.updated_at,
    reviewedBy: row.reviewed_by,
    reviewNotes: row.review_notes || '',
    signature: row.signature_url,
    personal: formData.personal || {
      firstName: row.full_name?.split(' ')[0] || 'David',
      lastName: row.full_name?.split(' ').slice(1).join(' ') || 'Miller',
      email: 'david.miller@primeroute.io',
      phone: row.phone || '+1 (555) 349-1029',
      dob: row.dob ? new Date(row.dob).toISOString().split('T')[0] : '1992-06-14',
      address: row.address || '742 Evergreen Terrace',
      ssnLast4: row.ssn_last4 || '4829',
      emergencyName: emergency.name || 'Sarah Miller',
      emergencyPhone: emergency.phone || '+1 (555) 981-2231',
      emergencyRelation: emergency.relation || 'Spouse'
    },
    employment: formData.employment || {
      position: 'Fleet Technician & Detailer',
      department: 'Operations',
      startDate: '2024-03-15',
      manager: 'Marcus Brody',
      employmentType: 'Full-Time',
      bankName: directDeposit.bank || 'Chase Commercial',
      routingNumber: directDeposit.routing || '••••4812',
      accountNumber: directDeposit.account || '••••••••8819',
      taxStatus: 'W-4 Single (1 Allowance)'
    },
    documents: formData.documents || {
      driversLicense: { name: 'DL_DavidMiller_2026.pdf', size: '2.4 MB', uploadedAt: '2024-03-12' },
      w4Form: { name: 'W4_Signed_2024.pdf', size: '1.1 MB', uploadedAt: '2024-03-14' },
      i9Verification: { name: 'I9_Verification_Miller.pdf', size: '3.8 MB', uploadedAt: '2024-03-14' },
      directDepositVoidCheck: { name: 'VoidCheck_Chase.pdf', size: '890 KB', uploadedAt: '2024-03-13' }
    },
    agreements: formData.agreements || {
      handbookAcknowledged: true,
      confidentialitySigned: true,
      safetyPolicyAgreed: true,
      directDepositConsent: true,
      electronicSignature: row.signature_url || 'David Miller',
      signedDate: row.submitted_at ? new Date(row.submitted_at).toISOString().split('T')[0] : '2024-03-14'
    }
  };
}

/**
 * Get active employee paperwork record
 */
async function getActivePaperwork(userId = null) {
  let query = db('employee_paperwork').orderBy('id', 'desc');
  if (userId) {
    const userSpecific = await db('employee_paperwork').where({ user_id: userId }).orderBy('id', 'desc').first();
    if (userSpecific) return formatPaperwork(userSpecific);
  }
  const row = await query.first();
  return row ? formatPaperwork(row) : null;
}

/**
 * Get paperwork by ID
 */
async function getPaperworkById(id) {
  const row = await db('employee_paperwork').where({ id }).first();
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
async function savePaperwork(payload, userId = 1) {
  const existing = await db('employee_paperwork').where({ user_id: userId }).first();

  const fullName = payload.personal
    ? `${payload.personal.firstName || ''} ${payload.personal.lastName || ''}`.trim()
    : (payload.fullName || 'David Miller');

  const ssnLast4 = payload.personal?.ssnLast4 || '4829';
  const phone = payload.personal?.phone || '+1 (555) 349-1029';
  const address = payload.personal?.address || '742 Evergreen Terrace';
  const dob = payload.personal?.dob || '1992-06-14';

  const statusInput = (payload.status || 'submitted').toLowerCase().replace(' ', '_');
  const validStatuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected'];
  const dbStatus = validStatuses.includes(statusInput) ? statusInput : 'submitted';

  const rowData = {
    user_id: userId,
    driver_id: payload.driverId || 2,
    full_name: fullName,
    ssn_last4: ssnLast4.slice(-4),
    dob: dob,
    address: address,
    phone: phone,
    emergency_contact: JSON.stringify(payload.personal ? {
      name: payload.personal.emergencyName,
      phone: payload.personal.emergencyPhone,
      relation: payload.personal.emergencyRelation
    } : {}),
    direct_deposit_details: JSON.stringify(payload.employment ? {
      bank: payload.employment.bankName,
      routing: payload.employment.routingNumber,
      account: payload.employment.accountNumber
    } : {}),
    status: dbStatus,
    submitted_at: dbStatus === 'submitted' ? db.fn.now() : (existing?.submitted_at || null),
    signature_url: payload.agreements?.electronicSignature || payload.signature || fullName,
    form_data: JSON.stringify(payload),
    updated_at: db.fn.now()
  };

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
 * Review paperwork (Approve or Reject)
 */
async function reviewPaperwork(id, action, notes = '', reviewerId = 1) {
  const existing = await db('employee_paperwork').where({ id }).first();
  if (!existing) {
    const err = new Error(`Paperwork #${id} not found`);
    err.status = 404;
    throw err;
  }

  const nextStatus = action.toLowerCase() === 'approve' ? 'approved' : 'rejected';

  await db('employee_paperwork').where({ id }).update({
    status: nextStatus,
    reviewed_by: reviewerId,
    review_notes: notes || (nextStatus === 'approved' ? 'Approved by Admin' : 'Changes requested'),
    updated_at: db.fn.now()
  });

  return getPaperworkById(id);
}

module.exports = {
  getActivePaperwork,
  getPaperworkById,
  savePaperwork,
  reviewPaperwork
};
