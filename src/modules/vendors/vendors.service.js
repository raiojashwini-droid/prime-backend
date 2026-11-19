const db = require('../../config/db');

/**
 * Format vendor row for frontend consumption
 */
function formatVendor(v, spendYTD = 0) {
  return {
    id: `VND-${String(v.id).padStart(3, '0')}`,
    rawId: v.id,
    name: v.name,
    category: v.category || 'repairs',
    services: v.service_type || 'General Fleet Support',
    contact: v.contact_person || '',
    phone: v.phone || '',
    email: v.email || '',
    address: v.address || '',
    terms: v.terms || 'Net 30',
    notes: v.notes || '',
    spendYTD: Number(spendYTD || 0),
    status: v.status === 'active' ? 'Active Partner' : 'Inactive',
    createdAt: v.created_at,
    updatedAt: v.updated_at
  };
}

/**
 * Get all vendors with live spend aggregated from expenses table
 */
async function getAllVendors(filters = {}) {
  let query = db('vendors').select('*').orderBy('id', 'asc');

  if (filters.status && filters.status !== 'All') {
    const dbStatus = filters.status.includes('Active') ? 'active' : 'inactive';
    query = query.where('status', dbStatus);
  }

  if (filters.category && filters.category !== 'All') {
    query = query.where('category', filters.category);
  }

  if (filters.search) {
    const s = `%${filters.search.toLowerCase()}%`;
    query = query.where(function () {
      this.whereRaw('LOWER(name) LIKE ?', [s])
        .orWhereRaw('LOWER(contact_person) LIKE ?', [s])
        .orWhereRaw('LOWER(email) LIKE ?', [s])
        .orWhereRaw('LOWER(service_type) LIKE ?', [s]);
    });
  }

  const vendors = await query;

  // Calculate live spend for each vendor from expenses table
  const spendRows = await db('expenses')
    .select('vendor_id')
    .sum('amount as totalSpend')
    .whereNot('status', 'Rejected')
    .groupBy('vendor_id');

  const spendMap = {};
  spendRows.forEach((r) => {
    spendMap[r.vendor_id] = Number(r.totalSpend || 0);
  });

  const formattedVendors = vendors.map((v) => {
    const spend = spendMap[v.id] || 0;
    return formatVendor(v, spend);
  });

  // Calculate high-level summary metrics
  const totalVendors = formattedVendors.length;
  const activeVendors = formattedVendors.filter((v) => v.status === 'Active Partner').length;
  const totalSpendYTD = formattedVendors.reduce((sum, v) => sum + v.spendYTD, 0);

  return {
    vendors: formattedVendors,
    stats: {
      totalVendors,
      activeVendors,
      totalSpendYTD,
      standardTerms: 'Net 30'
    }
  };
}

/**
 * Get single vendor with transaction history
 */
async function getVendorById(id) {
  const numericId = typeof id === 'string' && id.startsWith('VND-')
    ? parseInt(id.replace('VND-', ''), 10)
    : parseInt(id, 10);

  if (!numericId || isNaN(numericId)) return null;

  const vendor = await db('vendors').where({ id: numericId }).first();
  if (!vendor) return null;

  // Fetch all associated expenses / bills
  const expenses = await db('expenses')
    .select('*')
    .where({ vendor_id: numericId })
    .orderBy('expense_date', 'desc');

  const totalSpend = expenses
    .filter((e) => e.status !== 'Rejected')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return {
    ...formatVendor(vendor, totalSpend),
    expenses: expenses.map((e) => ({
      id: `EXP-${String(e.id).padStart(3, '0')}`,
      rawId: e.id,
      date: e.expense_date,
      category: e.category,
      amount: Number(e.amount),
      status: e.status === 'approved' ? 'Approved' : e.status === 'paid' ? 'Paid' : 'Pending',
      description: e.description,
      paymentMethod: e.payment_method
    }))
  };
}

/**
 * Create a new vendor in MySQL
 */
async function createVendor(data) {
  if (!data.name || !data.name.trim()) {
    const err = new Error('Vendor name is required.');
    err.status = 400;
    throw err;
  }

  const existing = await db('vendors')
    .whereRaw('LOWER(name) = ?', [data.name.trim().toLowerCase()])
    .first();
  if (existing) {
    const err = new Error(`Vendor "${data.name.trim()}" already exists in the directory.`);
    err.status = 409;
    throw err;
  }

  const [newId] = await db('vendors').insert({
    name: data.name,
    category: data.category || 'repairs',
    service_type: data.services || data.serviceType || 'General Fleet Support',
    contact_person: data.contact || data.contactPerson || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    terms: data.terms || 'Net 30',
    notes: data.notes || '',
    status: data.status && data.status.toLowerCase().includes('inactive') ? 'inactive' : 'active'
  });

  const created = await db('vendors').where({ id: newId }).first();
  return formatVendor(created, 0);
}

/**
 * Update an existing vendor
 */
async function updateVendor(id, data) {
  const numericId = typeof id === 'string' && id.startsWith('VND-')
    ? parseInt(id.replace('VND-', ''), 10)
    : parseInt(id, 10);

  if (!numericId || isNaN(numericId)) {
    const err = new Error(`Vendor #${id} not found`);
    err.status = 404;
    throw err;
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.services !== undefined || data.serviceType !== undefined) {
    updateData.service_type = data.services || data.serviceType;
  }
  if (data.contact !== undefined || data.contactPerson !== undefined) {
    updateData.contact_person = data.contact || data.contactPerson;
  }
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.terms !== undefined) updateData.terms = data.terms;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status !== undefined) {
    updateData.status = data.status.toLowerCase().includes('inactive') ? 'inactive' : 'active';
  }

  await db('vendors').where({ id: numericId }).update(updateData);
  return getVendorById(numericId);
}

/**
 * Delete / Archive a vendor
 */
async function deleteVendor(id) {
  const numericId = typeof id === 'string' && id.startsWith('VND-')
    ? parseInt(id.replace('VND-', ''), 10)
    : parseInt(id, 10);

  if (!numericId || isNaN(numericId)) {
    const err = new Error(`Vendor #${id} not found`);
    err.status = 404;
    throw err;
  }

  // Soft delete / set to inactive or hard delete if no expenses
  const expenses = await db('expenses').where({ vendor_id: numericId });
  if (expenses && expenses.length > 0) {
    await db('vendors').where({ id: numericId }).update({ status: 'inactive' });
    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return {
      success: true,
      deactivated: true,
      message: `Vendor has existing financial records ($${totalAmount.toLocaleString()} across ${expenses.length} bills in Accounting); deactivated to Inactive status.`,
      financialRecords: {
        count: expenses.length,
        totalAmount,
        location: 'Payments & Accounting (/accounting) -> Payables (AP)',
        sampleInvoices: expenses.slice(0, 3).map((e) => e.description || `Invoice #${e.id}`)
      }
    };
  } else {
    await db('vendors').where({ id: numericId }).del();
    return { success: true, deactivated: false, message: 'Vendor deleted successfully.' };
  }
}

/**
 * Reactivate an inactive vendor back to Active Partner
 */
async function reactivateVendor(id) {
  const numericId = typeof id === 'string' && id.startsWith('VND-')
    ? parseInt(id.replace('VND-', ''), 10)
    : parseInt(id, 10);

  if (!numericId || isNaN(numericId)) {
    const err = new Error(`Vendor #${id} not found`);
    err.status = 404;
    throw err;
  }

  await db('vendors').where({ id: numericId }).update({ status: 'active' });
  return getVendorById(numericId);
}

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  reactivateVendor
};
