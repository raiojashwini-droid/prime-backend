const db = require('../../config/db');

function safeParseJson(data, fallback = {}) {
  if (!data) return fallback;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
}

// Map payment method to DB enum
function sanitizePaymentMethod(method) {
  if (!method) return 'bank_transfer';
  const m = method.toLowerCase();
  if (m.includes('cash')) return 'cash';
  if (m.includes('zelle')) return 'zelle';
  if (m.includes('stripe')) return 'stripe';
  if (m.includes('card') || m.includes('credit') || m.includes('debit')) return 'card';
  if (m.includes('ach') || m.includes('wire') || m.includes('bank')) return 'bank_transfer';
  if (m.includes('adjustment')) return 'adjustment';
  return 'bank_transfer';
}

// Robust resolver to ensure driver_id and rental_id are valid database foreign keys
async function resolveDriverAndRental(data) {
  let driverId = null;
  let rentalId = null;
  let driverName = data.driver || data.driver_name || '';
  let rentalCode = data.rental || data.rental_code || data.contractId || '';

  // 1. Resolve driverId
  if (data.driverId !== undefined && data.driverId !== null && !isNaN(Number(data.driverId))) {
    driverId = Number(data.driverId);
  } else if (typeof data.driverId === 'string' && data.driverId.startsWith('DRV-')) {
    const num = parseInt(data.driverId.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) driverId = num;
  }

  if (!driverId && driverName) {
    const d = await db('drivers')
      .whereRaw("CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,'')) LIKE ?", [`%${driverName}%`])
      .first();
    if (d) {
      driverId = d.id;
      driverName = `${d.first_name || ''} ${d.last_name || ''}`.trim();
    }
  }

  // Ensure driverId exists in drivers table to prevent foreign key errors
  if (driverId) {
    const dExists = await db('drivers').where({ id: driverId }).first();
    if (!dExists) driverId = null;
  }

  // 2. Resolve rentalId
  if (data.rentalId !== undefined && data.rentalId !== null && !isNaN(Number(data.rentalId))) {
    rentalId = Number(data.rentalId);
  }

  // Look up by contract_no / rental code
  const codeCandidate = (typeof data.rentalId === 'string' && data.rentalId.startsWith('RNT-'))
    ? data.rentalId
    : rentalCode;

  if (!rentalId && codeCandidate) {
    const r = await db('rentals').where({ contract_no: codeCandidate }).first();
    if (r) {
      rentalId = r.id;
      rentalCode = r.contract_no;
    }
  }

  // If driverId known, check active rental
  if (!rentalId && driverId) {
    const r = await db('rentals').where({ driver_id: driverId }).orderBy('id', 'desc').first();
    if (r) {
      rentalId = r.id;
      if (!rentalCode) rentalCode = r.contract_no;
    }
  }

  // Ensure rentalId exists in rentals table to prevent foreign key errors
  if (rentalId) {
    const rExists = await db('rentals').where({ id: rentalId }).first();
    if (!rExists) rentalId = null;
  }

  return { driverId, rentalId, driverName, rentalCode };
}

// -----------------------------------------------------------------
// 1. CHARGES
// -----------------------------------------------------------------
async function getAllCharges() {
  const rows = await db('ledger_entries')
    .leftJoin('drivers', 'ledger_entries.driver_id', 'drivers.id')
    .leftJoin('rentals', 'ledger_entries.rental_id', 'rentals.id')
    .where('ledger_entries.entry_type', 'charge')
    .select(
      'ledger_entries.*',
      'drivers.first_name as driver_first_name',
      'drivers.last_name as driver_last_name',
      'rentals.contract_no as rental_agreement_no'
    )
    .orderBy('ledger_entries.id', 'desc');

  return rows.map((c) => {
    const driverFullName = c.driver_name || (c.driver_first_name ? `${c.driver_first_name} ${c.driver_last_name}`.trim() : 'Unassigned Driver');
    return {
      id: `CHG-${String(c.id).padStart(3, '0')}`,
      rawId: c.id,
      driver: driverFullName,
      driverId: c.driver_id,
      rental: c.rental_code || c.rental_agreement_no || 'RNT-2024-001',
      rentalId: c.rental_id,
      date: c.entry_date ? new Date(c.entry_date).toISOString().split('T')[0] : '',
      category: c.category || 'Weekly Lease',
      description: c.description || `${c.category || 'Lease'} charge for ${driverFullName}`,
      amount: Number(c.amount),
      status: c.status || 'Posted',
      qboRef: c.qbo_ref || 'Pending Sync',
      createdAt: c.created_at
    };
  });
}

async function createCharge(data) {
  const { driverId, rentalId, driverName, rentalCode } = await resolveDriverAndRental(data);

  const insertData = {
    driver_id: driverId,
    rental_id: rentalId,
    entry_type: 'charge',
    amount: Number(data.amount) || 0,
    category: data.category || 'Weekly Lease',
    description: data.description || `${data.category || 'Charge'} for ${driverName || 'Driver'}`,
    status: data.status || 'Posted',
    qbo_ref: data.qboRef || `QBO-CHG-${Math.floor(1000 + Math.random() * 9000)}`,
    driver_name: driverName || '',
    rental_code: rentalCode || '',
    entry_date: data.date || new Date().toISOString().split('T')[0],
    metadata: data.metadata ? JSON.stringify(data.metadata) : null
  };

  const [id] = await db('ledger_entries').insert(insertData);
  return (await getAllCharges()).find((c) => c.rawId === id);
}

// -----------------------------------------------------------------
// 2. PAYMENTS
// -----------------------------------------------------------------
async function getAllPayments() {
  const rows = await db('ledger_entries')
    .leftJoin('drivers', 'ledger_entries.driver_id', 'drivers.id')
    .leftJoin('rentals', 'ledger_entries.rental_id', 'rentals.id')
    .where('ledger_entries.entry_type', 'payment')
    .select(
      'ledger_entries.*',
      'drivers.first_name as driver_first_name',
      'drivers.last_name as driver_last_name',
      'rentals.contract_no as rental_agreement_no'
    )
    .orderBy('ledger_entries.id', 'desc');

  return rows.map((p) => {
    const meta = safeParseJson(p.metadata, {});
    const driverFullName = p.driver_name || (p.driver_first_name ? `${p.driver_first_name} ${p.driver_last_name}`.trim() : 'Corporate Remittance');
    return {
      id: `PMT-${String(p.id).padStart(3, '0')}`,
      rawId: p.id,
      driver: driverFullName,
      driverId: p.driver_id,
      rental: p.rental_code || p.rental_agreement_no || 'RNT-2024-001',
      date: p.entry_date ? new Date(p.entry_date).toISOString().split('T')[0] : '',
      dueDate: meta.dueDate || (p.entry_date ? new Date(p.entry_date).toISOString().split('T')[0] : ''),
      method: meta.displayMethod || (p.payment_method ? p.payment_method.toUpperCase() : 'Corporate ACH'),
      refNumber: p.reference_no || `ACH-${p.id}`,
      referenceNumber: p.reference_no || `ACH-${p.id}`,
      status: p.status || 'Paid',
      amount: Number(p.amount),
      receiptNo: meta.receiptNo || `REC-2026-${String(p.id).padStart(3, '0')}`,
      qboRef: p.qbo_ref || 'Pending Sync',
      notes: p.notes || ''
    };
  });
}

async function createPayment(data) {
  const { driverId, rentalId, driverName, rentalCode } = await resolveDriverAndRental(data);

  const receiptNum = `REC-2026-${Math.floor(100 + Math.random() * 900)}`;
  const meta = {
    dueDate: data.dueDate || data.date || new Date().toISOString().split('T')[0],
    displayMethod: data.method || 'Corporate ACH',
    receiptNo: receiptNum,
    ...(data.metadata || {})
  };

  const insertData = {
    driver_id: driverId,
    rental_id: rentalId,
    entry_type: 'payment',
    amount: Number(data.amount) || 0,
    payment_method: sanitizePaymentMethod(data.method),
    reference_no: data.referenceNumber || data.refNumber || `REF-${Date.now()}`,
    notes: data.notes || 'Commercial lease remittance received.',
    status: data.status || 'Paid',
    qbo_ref: data.qboRef || `QBO-PMT-${Math.floor(1000 + Math.random() * 9000)}`,
    driver_name: driverName || '',
    rental_code: rentalCode || '',
    entry_date: data.date || new Date().toISOString().split('T')[0],
    metadata: JSON.stringify(meta)
  };

  const [id] = await db('ledger_entries').insert(insertData);
  const created = (await getAllPayments()).find((p) => p.rawId === id);
  return created;
}

// -----------------------------------------------------------------
// 3. DEPOSITS (ESCROW LIABILITY - ACCOUNT 2100)
// -----------------------------------------------------------------
async function getAllDeposits() {
  const rows = await db('ledger_entries')
    .leftJoin('drivers', 'ledger_entries.driver_id', 'drivers.id')
    .leftJoin('rentals', 'ledger_entries.rental_id', 'rentals.id')
    .where('ledger_entries.entry_type', 'deposit')
    .select(
      'ledger_entries.*',
      'drivers.first_name as driver_first_name',
      'drivers.last_name as driver_last_name',
      'rentals.contract_no as rental_agreement_no'
    )
    .orderBy('ledger_entries.id', 'desc');

  return rows.map((d) => {
    const meta = safeParseJson(d.metadata, {});
    const driverFullName = d.driver_name || (d.driver_first_name ? `${d.driver_first_name} ${d.driver_last_name}`.trim() : 'Fleet Customer');
    return {
      id: `DEP-${String(d.id).padStart(3, '0')}`,
      rawId: d.id,
      driver: driverFullName,
      vehicle: meta.vehicle || 'Toyota Camry SE (PR-2024-TC)',
      contractId: d.rental_code || d.rental_agreement_no || 'RNT-2024-089',
      heldDate: d.entry_date ? new Date(d.entry_date).toISOString().split('T')[0] : '',
      depositAmount: Number(d.amount),
      deductions: Number(meta.deductions || 0),
      balance: Number(meta.balance !== undefined ? meta.balance : d.amount),
      status: d.status || 'Held in Escrow'
    };
  });
}

async function createDeposit(data) {
  const { driverId, rentalId, driverName, rentalCode } = await resolveDriverAndRental(data);

  const depositAmt = Number(data.depositAmount || data.amount || 500);
  const deductionsAmt = Number(data.deductions || 0);
  const balanceAmt = depositAmt - deductionsAmt;

  const meta = {
    vehicle: data.vehicle || 'Toyota Camry SE',
    deductions: deductionsAmt,
    balance: balanceAmt,
    ...(data.metadata || {})
  };

  const insertData = {
    driver_id: driverId,
    rental_id: rentalId,
    entry_type: 'deposit',
    amount: depositAmt,
    status: data.status || 'Held in Escrow',
    driver_name: driverName || '',
    rental_code: rentalCode || '',
    entry_date: data.heldDate || data.date || new Date().toISOString().split('T')[0],
    notes: data.notes || 'Security deposit held in escrow.',
    metadata: JSON.stringify(meta)
  };

  const [id] = await db('ledger_entries').insert(insertData);
  return (await getAllDeposits()).find((d) => d.rawId === id);
}

async function releaseDeposit(rawId, data = {}) {
  const existing = await db('ledger_entries').where({ id: rawId, entry_type: 'deposit' }).first();
  if (!existing) {
    const error = new Error(`Deposit record #${rawId} not found`);
    error.status = 404;
    throw error;
  }

  if (
    existing.status === 'Refunded / Released' ||
    existing.status === 'Reversed' ||
    existing.status === 'Reversed & Offset'
  ) {
    const error = new Error(`Deposit #${rawId} is already ${existing.status} and cannot be released again.`);
    error.status = 400;
    throw error;
  }

  const meta = safeParseJson(existing.metadata, {});
  const currentBalance = Number(meta.balance !== undefined ? meta.balance : existing.amount);
  if (currentBalance <= 0) {
    const error = new Error(`Deposit #${rawId} has a zero escrow balance and cannot be refunded.`);
    error.status = 400;
    throw error;
  }

  const refundAmount = Number(data.refundAmount !== undefined ? data.refundAmount : currentBalance);

  // 1. Mark deposit as Released / Refunded
  meta.balance = 0;
  meta.releasedAt = new Date().toISOString();
  meta.releaseReason = data.reason || 'Lease concluded; deposit released from escrow.';

  await db('ledger_entries').where({ id: rawId }).update({
    status: 'Refunded / Released',
    metadata: JSON.stringify(meta),
    updated_at: db.fn.now()
  });

  // 2. Automatically create linked refund record in ledger
  const refundInsert = {
    driver_id: existing.driver_id,
    rental_id: existing.rental_id,
    entry_type: 'refund',
    amount: refundAmount,
    payment_method: 'bank_transfer',
    reference_no: `ACH-REF-${Math.floor(10000 + Math.random() * 90000)}`,
    status: 'Processed',
    category: 'Security Deposit Refund',
    driver_name: existing.driver_name,
    rental_code: existing.rental_code,
    entry_date: new Date().toISOString().split('T')[0],
    notes: data.reason || 'Lease concluded; deposit released from escrow.',
    metadata: JSON.stringify({
      depositId: `DEP-${String(existing.id).padStart(3, '0')}`,
      depositRawId: existing.id,
      method: data.method || 'Direct ACH Refund'
    })
  };

  await db('ledger_entries').insert(refundInsert);

  return (await getAllDeposits()).find((d) => d.rawId === rawId);
}

// -----------------------------------------------------------------
// 4. REFUNDS
// -----------------------------------------------------------------
async function getAllRefunds() {
  const rows = await db('ledger_entries')
    .leftJoin('drivers', 'ledger_entries.driver_id', 'drivers.id')
    .where('ledger_entries.entry_type', 'refund')
    .select('ledger_entries.*', 'drivers.first_name as driver_first_name', 'drivers.last_name as driver_last_name')
    .orderBy('ledger_entries.id', 'desc');

  return rows.map((r) => {
    const meta = safeParseJson(r.metadata, {});
    const driverFullName = r.driver_name || (r.driver_first_name ? `${r.driver_first_name} ${r.driver_last_name}`.trim() : 'Driver Remittance');
    return {
      id: `REF-${String(r.id).padStart(3, '0')}`,
      rawId: r.id,
      driver: driverFullName,
      depositId: meta.depositId || '',
      date: r.entry_date ? new Date(r.entry_date).toISOString().split('T')[0] : '',
      category: r.category || 'Security Deposit Refund',
      method: meta.method || 'Direct ACH Refund',
      amount: Number(r.amount),
      status: r.status || 'Processed',
      refNumber: r.reference_no || `ACH-REF-${r.id}`,
      reason: r.notes || meta.reason || 'Lease completed; deposit returned'
    };
  });
}

async function createRefund(data) {
  const { driverId, rentalId, driverName, rentalCode } = await resolveDriverAndRental(data);

  const meta = {
    depositId: data.depositId || '',
    method: data.method || 'Direct ACH Refund',
    reason: data.reason || ''
  };

  const insertData = {
    driver_id: driverId,
    rental_id: rentalId,
    entry_type: 'refund',
    amount: Number(data.amount) || 0,
    payment_method: sanitizePaymentMethod(data.method),
    category: data.category || 'Security Deposit Refund',
    reference_no: data.refNumber || `ACH-REF-${Date.now().toString().slice(-5)}`,
    status: data.status || 'Processed',
    driver_name: driverName || '',
    rental_code: rentalCode || '',
    entry_date: data.date || new Date().toISOString().split('T')[0],
    notes: data.reason || 'Refund processed',
    metadata: JSON.stringify(meta)
  };

  const [id] = await db('ledger_entries').insert(insertData);
  return (await getAllRefunds()).find((r) => r.rawId === id);
}

// -----------------------------------------------------------------
// 5. CREDITS / ADJUSTMENTS
// -----------------------------------------------------------------
async function getAllCredits() {
  const rows = await db('ledger_entries')
    .leftJoin('drivers', 'ledger_entries.driver_id', 'drivers.id')
    .whereIn('ledger_entries.entry_type', ['credit', 'adjustment', 'reversal'])
    .select('ledger_entries.*', 'drivers.first_name as driver_first_name', 'drivers.last_name as driver_last_name')
    .orderBy('ledger_entries.id', 'desc');

  return rows.map((cr) => {
    const meta = safeParseJson(cr.metadata, {});
    const driverFullName = cr.driver_name || (cr.driver_first_name ? `${cr.driver_first_name} ${cr.driver_last_name}`.trim() : 'Authorized Entity');
    return {
      id: cr.entry_type === 'reversal' ? `REV-${cr.id}` : `CR-${String(cr.id).padStart(3, '0')}`,
      rawId: cr.id,
      driver: driverFullName,
      rental: cr.rental_code || 'N/A',
      date: cr.entry_date ? new Date(cr.entry_date).toISOString().split('T')[0] : '',
      type: cr.category || (cr.entry_type === 'reversal' ? 'Reversal / Linked Correction' : 'Goodwill Discount'),
      amount: Number(cr.amount),
      reason: cr.notes || cr.description || '',
      approvedBy: meta.approvedBy || meta.authorizedBy || 'Finance Officer',
      status: cr.status || 'Applied'
    };
  });
}

async function createCredit(data) {
  const { driverId, rentalId, driverName, rentalCode } = await resolveDriverAndRental(data);

  const meta = {
    approvedBy: data.approvedBy || 'Finance Officer',
    reason: data.reason || ''
  };

  const insertData = {
    driver_id: driverId,
    rental_id: rentalId,
    entry_type: 'credit',
    amount: Number(data.amount) || 0,
    category: data.type || 'Goodwill Discount',
    status: data.status || 'Applied',
    driver_name: driverName || '',
    rental_code: rentalCode || '',
    entry_date: data.date || new Date().toISOString().split('T')[0],
    notes: data.reason || '',
    metadata: JSON.stringify(meta)
  };

  const [id] = await db('ledger_entries').insert(insertData);
  return (await getAllCredits()).find((cr) => cr.rawId === id);
}

// -----------------------------------------------------------------
// 6. INVOICES
// -----------------------------------------------------------------
async function getAllInvoices() {
  const rows = await db('invoices')
    .leftJoin('drivers', 'invoices.driver_id', 'drivers.id')
    .leftJoin('rentals', 'invoices.rental_id', 'rentals.id')
    .select(
      'invoices.*',
      'drivers.first_name as driver_first_name',
      'drivers.last_name as driver_last_name',
      'rentals.contract_no as rental_agreement_no'
    )
    .orderBy('invoices.id', 'desc');

  return rows.map((inv) => {
    const customer = inv.customer_name || (inv.driver_first_name ? `${inv.driver_first_name} ${inv.driver_last_name}`.trim() : 'Corporate Account');
    let statusFormatted = 'Pending';
    if (inv.status === 'paid') statusFormatted = 'Paid';
    else if (inv.status === 'overdue') statusFormatted = 'Overdue';
    else if (inv.status === 'partially_paid') statusFormatted = 'Partial';
    else if (inv.status === 'cancelled' || inv.status === 'void') statusFormatted = 'Reversed';

    return {
      id: inv.invoice_number || `INV-${inv.id}`,
      rawId: inv.id,
      invoiceNumber: inv.invoice_number,
      customer,
      driver: customer,
      vehicle: inv.vehicle_name || 'Toyota Camry SE (PR-2024-TC)',
      date: inv.issue_date ? new Date(inv.issue_date).toISOString().split('T')[0] : '',
      dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split('T')[0] : '',
      subtotal: Number(inv.subtotal),
      tax: Number(inv.tax),
      total: Number(inv.total_amount),
      paidAmount: Number(inv.paid_amount),
      balance: Number(inv.balance),
      status: statusFormatted,
      notes: inv.notes || ''
    };
  });
}

async function createInvoice(data) {
  const subtotal = Number(data.subtotal || data.total || 0);
  const tax = Number(data.tax || 0);
  const total = Number(data.total || subtotal + tax);
  const paid = Number(data.paidAmount || 0);
  const balance = total - paid;

  let dbStatus = 'issued';
  if (data.status) {
    const s = data.status.toLowerCase();
    if (s === 'paid') dbStatus = 'paid';
    else if (s === 'overdue') dbStatus = 'overdue';
    else if (s === 'partial') dbStatus = 'partially_paid';
  }

  const invoiceNum = data.invoiceNumber || data.id || `INV-2026-${Math.floor(100 + Math.random() * 900)}`;

  const insertData = {
    invoice_number: invoiceNum,
    customer_name: data.customer || data.driver || 'Corporate Customer',
    vehicle_name: data.vehicle || 'Fleet Vehicle',
    issue_date: data.date || data.issueDate || new Date().toISOString().split('T')[0],
    due_date: data.dueDate || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    subtotal,
    tax,
    total_amount: total,
    paid_amount: paid,
    balance,
    status: dbStatus,
    notes: data.notes || ''
  };

  const [id] = await db('invoices').insert(insertData);
  return (await getAllInvoices()).find((inv) => inv.rawId === id);
}

// -----------------------------------------------------------------
// 7. PAYABLES & EXPENSES (AP)
// -----------------------------------------------------------------
async function getAllPayables() {
  const rows = await db('expenses')
    .leftJoin('vendors', 'expenses.vendor_id', 'vendors.id')
    .leftJoin('vehicles', 'expenses.vehicle_id', 'vehicles.id')
    .select(
      'expenses.*',
      'vendors.name as vendor_company_name',
      'vehicles.make as vehicle_make',
      'vehicles.model as vehicle_model',
      'vehicles.plate as vehicle_plate'
    )
    .orderBy('expenses.id', 'desc');

  return rows.map((exp) => {
    let statusFormatted = 'Approved for Payment';
    if (exp.status === 'pending') statusFormatted = 'Pending Approval';
    else if (exp.status === 'paid') statusFormatted = 'Paid';
    else if (exp.status === 'rejected') statusFormatted = 'Rejected';

    const categoryCapitalized = exp.category ? exp.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Vehicle Maintenance';

    return {
      id: `AP-${String(exp.id).padStart(3, '0')}`,
      rawId: exp.id,
      vendor: exp.vendor_company_name || 'Fleet Vendor',
      vendorId: exp.vendor_id,
      category: categoryCapitalized,
      billDate: exp.expense_date ? new Date(exp.expense_date).toISOString().split('T')[0] : '',
      dueDate: new Date(new Date(exp.expense_date).getTime() + 20 * 24 * 3600 * 1000).toISOString().split('T')[0],
      amount: Number(exp.amount),
      status: statusFormatted,
      term: 'Net 20',
      description: exp.description || '',
      vehicle: exp.vehicle_plate ? `${exp.vehicle_make} ${exp.vehicle_model} (${exp.vehicle_plate})` : ''
    };
  });
}

async function createPayable(data) {
  let vendorId = null;
  if (data.vendorId) {
    if (typeof data.vendorId === 'string' && data.vendorId.startsWith('VND-')) {
      const parsed = parseInt(data.vendorId.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed)) vendorId = parsed;
    } else if (!isNaN(Number(data.vendorId))) {
      vendorId = Number(data.vendorId);
    }
  }
  if (!vendorId && data.vendor) {
    const v = await db('vendors').where('name', 'like', `%${data.vendor}%`).first();
    if (v) vendorId = v.id;
  }

  let dbStatus = 'approved';
  if (data.status) {
    const s = data.status.toLowerCase();
    if (s.includes('pending')) dbStatus = 'pending';
    else if (s.includes('paid')) dbStatus = 'paid';
    else if (s.includes('reject')) dbStatus = 'rejected';
  }

  const VALID_EXPENSE_ENUMS = [
    'insurance', 'registration', 'oil_change', 'repairs', 'tires',
    'towing', 'cleaning', 'tolls', 'parking', 'tickets',
    'marketing', 'software', 'bank_fees', 'office', 'legal_accounting', 'other'
  ];

  let cleanCategory = 'repairs';
  if (data.category) {
    const rawCat = String(data.category).toLowerCase().trim();
    const normalized = rawCat.replace(/[\s\/\-_]/g, '');
    const matchedEnum = VALID_EXPENSE_ENUMS.find(e => e.replace(/_/g, '') === normalized);

    if (matchedEnum) {
      cleanCategory = matchedEnum;
    } else if (rawCat.includes('fuel')) {
      cleanCategory = 'parking';
    } else if (rawCat.includes('maint') || rawCat.includes('repair') || rawCat.includes('vehic') || rawCat.includes('vechil') || rawCat.includes('car')) {
      cleanCategory = 'repairs';
    } else if (rawCat.includes('insur')) {
      cleanCategory = 'insurance';
    } else if (rawCat.includes('regist')) {
      cleanCategory = 'registration';
    } else if (rawCat.includes('toll')) {
      cleanCategory = 'tolls';
    } else if (rawCat.includes('clean')) {
      cleanCategory = 'cleaning';
    } else if (rawCat.includes('tire')) {
      cleanCategory = 'tires';
    } else if (rawCat.includes('ticket')) {
      cleanCategory = 'tickets';
    } else if (rawCat.includes('tow')) {
      cleanCategory = 'towing';
    } else if (rawCat.includes('bank') || rawCat.includes('fee')) {
      cleanCategory = 'bank_fees';
    } else if (rawCat.includes('market') || rawCat.includes('ad')) {
      cleanCategory = 'marketing';
    } else if (rawCat.includes('soft') || rawCat.includes('telem')) {
      cleanCategory = 'software';
    } else if (rawCat.includes('legal') || rawCat.includes('account')) {
      cleanCategory = 'legal_accounting';
    } else if (rawCat.includes('office')) {
      cleanCategory = 'office';
    } else {
      cleanCategory = 'other';
    }
  }

  const insertData = {
    vendor_id: vendorId,
    category: cleanCategory,
    amount: Number(data.amount) || 0,
    expense_date: data.billDate || data.date || new Date().toISOString().split('T')[0],
    description: data.description || `${data.category || 'Expense'} - ${data.vendor || 'Vendor'}`,
    status: dbStatus
  };

  const [id] = await db('expenses').insert(insertData);
  return (await getAllPayables()).find((p) => p.rawId === id);
}

async function updatePayableStatus(rawId, status) {
  let dbStatus = 'approved';
  const s = (status || '').toLowerCase();
  if (s.includes('paid')) dbStatus = 'paid';
  else if (s.includes('reject')) dbStatus = 'rejected';
  else if (s.includes('pending')) dbStatus = 'pending';

  await db('expenses').where({ id: rawId }).update({
    status: dbStatus,
    updated_at: db.fn.now()
  });

  return (await getAllPayables()).find((p) => p.rawId === rawId);
}

// -----------------------------------------------------------------
// 8. REVERSAL / OFFSETTING CORRECTION (ACCOUNTING IMMUTABILITY)
// -----------------------------------------------------------------
async function reverseTransaction(data) {
  const { originalTxId, reason, authorizedBy, reversalDate } = data;
  if (!originalTxId) {
    throw new Error('originalTxId is required to reverse transaction');
  }

  // Parse ID prefix: CHG-101, PMT-102, DEP-003, REF-004, CR-005, INV-006, AP-007
  const parts = originalTxId.split('-');
  const prefix = parts[0];
  const numId = parseInt(parts[1], 10);

  let originalRecord = null;
  let driverName = 'Authorized Entity';
  let rentalCode = 'N/A';
  let amount = 0;

  if (['CHG', 'PMT', 'DEP', 'REF', 'CR', 'REV'].includes(prefix) && !isNaN(numId)) {
    originalRecord = await db('ledger_entries').where({ id: numId }).first();
    if (originalRecord) {
      if (
        originalRecord.status === 'Reversed & Offset' ||
        originalRecord.status === 'Reversed'
      ) {
        const error = new Error(`Transaction ${originalTxId} is already reversed and cannot be reversed again.`);
        error.status = 400;
        throw error;
      }

      driverName = originalRecord.driver_name || 'Driver Entity';
      rentalCode = originalRecord.rental_code || 'N/A';
      amount = Number(originalRecord.amount);

      const updateData = {
        status: 'Reversed & Offset',
        updated_at: db.fn.now()
      };

      if (originalRecord.entry_type === 'deposit') {
        const meta = safeParseJson(originalRecord.metadata, {});
        meta.balance = 0;
        meta.reversedAt = new Date().toISOString();
        meta.reversalReason = reason || 'Reversed by authorized accountant';
        updateData.metadata = JSON.stringify(meta);
      }

      // Flag original as Reversed & Offset
      await db('ledger_entries').where({ id: numId }).update(updateData);
    }
  } else if (prefix === 'AP' && !isNaN(numId)) {
    originalRecord = await db('expenses').where({ id: numId }).first();
    if (originalRecord) {
      amount = Number(originalRecord.amount);
      await db('expenses').where({ id: numId }).update({
        status: 'rejected',
        updated_at: db.fn.now()
      });
    }
  } else if (prefix === 'INV' || originalTxId.startsWith('INV-')) {
    originalRecord = await db('invoices').where({ invoice_number: originalTxId }).orWhere({ id: numId || 0 }).first();
    if (originalRecord) {
      amount = Number(originalRecord.total_amount);
      await db('invoices').where({ id: originalRecord.id }).update({
        status: 'void',
        updated_at: db.fn.now()
      });
    }
  }

  // Create linked correction entry in ledger
  const correctionData = {
    entry_type: 'reversal',
    amount: -Math.abs(amount),
    category: 'Reversal / Linked Correction',
    description: `Reversal of ${originalTxId}: ${reason || 'Administrative correction'}`,
    status: 'Applied',
    driver_name: driverName,
    rental_code: rentalCode,
    entry_date: reversalDate || new Date().toISOString().split('T')[0],
    notes: reason || 'Reversal audit record',
    metadata: JSON.stringify({
      originalTxId,
      authorizedBy: authorizedBy || 'Finance Admin',
      syncStatus: 'Pending Sync to QBO'
    })
  };

  const [revId] = await db('ledger_entries').insert(correctionData);
  return {
    success: true,
    message: `Transaction ${originalTxId} reversed. Linked correction REV-${revId} created.`,
    reversalId: `REV-${revId}`
  };
}

// -----------------------------------------------------------------
// 9. DELETE ENTRY (FOR REAL PERMANENT CLEANUP IF NEEDED)
// -----------------------------------------------------------------
async function deleteEntry(type, id) {
  const numId = parseInt(String(id).replace(/[^0-9]/g, ''), 10);
  if (isNaN(numId)) throw new Error('Invalid ID');

  if (['charge', 'payment', 'deposit', 'refund', 'credit', 'reversal'].includes(type)) {
    await db('ledger_entries').where({ id: numId }).del();
    return { id: numId, message: `${type} record deleted successfully` };
  } else if (type === 'invoice') {
    await db('invoice_items').where({ invoice_id: numId }).del();
    await db('invoices').where({ id: numId }).del();
    return { id: numId, message: 'Invoice deleted successfully' };
  } else if (type === 'payable' || type === 'expense') {
    await db('expenses').where({ id: numId }).del();
    return { id: numId, message: 'Expense bill deleted successfully' };
  }
  throw new Error(`Unknown type ${type}`);
}

// -----------------------------------------------------------------
// 10. DRIVER BALANCES SUBLEDGER (DYNAMIC LIVE AGGREGATION)
// -----------------------------------------------------------------
async function getDriverBalances() {
  const charges = await getAllCharges();
  const payments = await getAllPayments();
  const credits = await getAllCredits();
  const deposits = await getAllDeposits();

  // Get distinct driver names
  const driverNames = Array.from(new Set([
    ...charges.map((c) => c.driver),
    ...payments.map((p) => p.driver),
    ...deposits.map((d) => d.driver),
    ...credits.map((cr) => cr.driver)
  ])).filter(Boolean);

  const dbDrivers = await db('drivers').select('id', 'first_name', 'last_name');
  const dbRentals = await db('rentals')
    .leftJoin('vehicles', 'rentals.vehicle_id', 'vehicles.id')
    .select('rentals.id', 'rentals.contract_no', 'rentals.driver_id', 'vehicles.make', 'vehicles.model', 'vehicles.plate');

  return driverNames.map((name) => {
    const dCharges = charges
      .filter((c) => c.driver === name && c.status !== 'Reversed' && c.status !== 'Reversed & Offset')
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const dPayments = payments
      .filter((p) => p.driver === name && p.status === 'Paid')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const dCredits = credits
      .filter((cr) => cr.driver === name && cr.status === 'Applied')
      .reduce((sum, cr) => sum + Number(cr.amount || 0), 0);

    const dDeposit = deposits
      .filter((d) => d.driver === name && d.status !== 'Refunded / Released')
      .reduce((sum, d) => sum + Number(d.balance || 0), 0);

    const netBalance = dCharges - (dPayments + dCredits);

    let status = 'Current / In Good Standing';
    if (netBalance > 500) status = 'Severely Overdue';
    else if (netBalance > 0) status = 'Overdue Balance';
    else if (netBalance < 0) status = 'Credit Balance';

    const dMatch = dbDrivers.find((d) => `${d.first_name || ''} ${d.last_name || ''}`.trim() === name);
    const rMatch = dMatch ? dbRentals.find((r) => r.driver_id === dMatch.id) : null;
    const vehicleStr = rMatch ? `${rMatch.make} ${rMatch.model} (${rMatch.plate})` : 'Toyota Camry SE (PR-2024-TC)';

    return {
      driver: name,
      driverId: dMatch ? `DRV-${dMatch.id}` : 'DRV-101',
      vehicle: vehicleStr,
      charges: dCharges,
      payments: dPayments,
      credits: dCredits,
      deposit: dDeposit,
      netBalance,
      status
    };
  });
}

// -----------------------------------------------------------------
// 11. FINANCIAL METRICS / TOP KPIS
// -----------------------------------------------------------------
async function getAccountingStats() {
  const charges = await getAllCharges();
  const payables = await getAllPayables();
  const invoices = await getAllInvoices();
  const deposits = await getAllDeposits();

  // Operating Revenue: sum of active charges (Excludes Escrow Deposits!)
  const totalOperatingRevenue = charges
    .filter((c) => c.status !== 'Reversed' && c.status !== 'Reversed & Offset')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  // Total Expenses: sum of approved or paid payables/expenses
  const totalExpenses = payables
    .filter((p) => p.status !== 'Rejected')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Net Profit
  const netProfit = totalOperatingRevenue - totalExpenses;

  // Pending AR: Unsettled invoices
  const totalPendingAR = invoices
    .filter((i) => i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Partial')
    .reduce((sum, i) => sum + Number(i.balance || i.total || 0), 0);

  // Escrow Liabilities: Customer deposits held in escrow (Account 2100)
  const totalEscrowLiability = deposits
    .filter((d) => d.status !== 'Refunded / Released')
    .reduce((sum, d) => sum + Number(d.balance || 0), 0);

  return {
    totalOperatingRevenue,
    totalExpenses,
    netProfit,
    totalPendingAR,
    totalEscrowLiability,
    counts: {
      charges: charges.length,
      payables: payables.length,
      invoices: invoices.length,
      deposits: deposits.length
    }
  };
}

// -----------------------------------------------------------------
// 12. VENDORS
// -----------------------------------------------------------------
async function getAllVendors() {
  const rows = await db('vendors').select('*').orderBy('name', 'asc');
  return rows.map((v) => ({
    id: v.id,
    name: v.name,
    category: v.service_type || 'Fleet Services',
    serviceType: v.service_type,
    contactPerson: v.contact_person,
    email: v.email,
    phone: v.phone,
    address: v.address,
    status: v.status || 'active'
  }));
}

module.exports = {
  // Charges
  getAllCharges,
  createCharge,
  // Payments
  getAllPayments,
  createPayment,
  // Deposits
  getAllDeposits,
  createDeposit,
  releaseDeposit,
  // Refunds
  getAllRefunds,
  createRefund,
  // Credits
  getAllCredits,
  createCredit,
  // Invoices
  getAllInvoices,
  createInvoice,
  // Payables
  getAllPayables,
  createPayable,
  updatePayableStatus,
  // Vendors
  getAllVendors,
  // Reversals & Delete
  reverseTransaction,
  deleteEntry,
  // Balances & Stats
  getDriverBalances,
  getAccountingStats
};
