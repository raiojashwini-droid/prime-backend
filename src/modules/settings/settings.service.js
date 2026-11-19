const db = require('../../config/db');

const DEFAULT_VEHICLE_STATUSES = [
  { id: 'VS-1', name: 'Available', color: 'emerald', description: 'Vehicle is ready and certified for active driver leasing.', canRent: true, canIntake: true, isSystem: true },
  { id: 'VS-2', name: 'Reserved', color: 'blue', description: 'Vehicle is allocated to an upcoming rental agreement awaiting pickup.', canRent: false, canIntake: true, isSystem: true },
  { id: 'VS-3', name: 'Rented', color: 'indigo', description: 'Vehicle is currently deployed under active driver lease contract.', canRent: false, canIntake: false, isSystem: true },
  { id: 'VS-4', name: 'Maintenance', color: 'amber', description: 'Vehicle is in workshop for scheduled service, repair, or recall.', canRent: false, canIntake: true, isSystem: true },
  { id: 'VS-5', name: 'Unavailable', color: 'rose', description: 'Vehicle is pulled from fleet intake due to impound, accident, or inspection hold.', canRent: false, canIntake: false, isSystem: true },
  { id: 'VS-6', name: 'Sold / Retired', color: 'slate', description: 'Asset has been liquidated, auctioned, or permanently decommissioned.', canRent: false, canIntake: false, isSystem: true }
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'EC-01', code: 'EXP-INS', name: 'insurance', taxDeductible: true, requiresApproval: true, status: 'Active' },
  { id: 'EC-02', code: 'EXP-REG', name: 'registration', taxDeductible: true, requiresApproval: false, status: 'Active' },
  { id: 'EC-03', code: 'EXP-OIL', name: 'oil change', taxDeductible: true, requiresApproval: false, status: 'Active' },
  { id: 'EC-04', code: 'EXP-REP', name: 'repairs', taxDeductible: true, requiresApproval: true, status: 'Active' },
  { id: 'EC-05', code: 'EXP-TIR', name: 'tires', taxDeductible: true, requiresApproval: true, status: 'Active' },
  { id: 'EC-06', code: 'EXP-TOW', name: 'towing', taxDeductible: true, requiresApproval: false, status: 'Active' },
  { id: 'EC-07', code: 'EXP-CLN', name: 'cleaning', taxDeductible: true, requiresApproval: false, status: 'Active' },
  { id: 'EC-08', code: 'EXP-TOL', name: 'tolls', taxDeductible: true, requiresApproval: false, status: 'Active' },
  { id: 'EC-09', code: 'EXP-PRK', name: 'parking', taxDeductible: true, requiresApproval: false, status: 'Active' },
  { id: 'EC-10', code: 'EXP-TCK', name: 'tickets', taxDeductible: false, requiresApproval: true, status: 'Active' },
  { id: 'EC-11', code: 'EXP-MKT', name: 'marketing', taxDeductible: true, requiresApproval: true, status: 'Active' },
  { id: 'EC-12', code: 'EXP-SFT', name: 'software', taxDeductible: true, requiresApproval: true, status: 'Active' },
  { id: 'EC-13', code: 'EXP-BNK', name: 'bank fees', taxDeductible: true, requiresApproval: false, status: 'Active' },
  { id: 'EC-14', code: 'EXP-OFC', name: 'office', taxDeductible: true, requiresApproval: false, status: 'Active' },
  { id: 'EC-15', code: 'EXP-LEG', name: 'legal/accounting', taxDeductible: true, requiresApproval: true, status: 'Active' },
  { id: 'EC-16', code: 'EXP-OTH', name: 'other', taxDeductible: true, requiresApproval: true, status: 'Active' }
];

const DEFAULT_TICKET_STATUSES = [
  { id: 'TS-1', name: 'Unassigned', stage: 'Intake', chargeable: false, description: 'Citation imported from tag feed; no driver contract yet matched.' },
  { id: 'TS-2', name: 'Under Review', stage: 'Review', chargeable: false, description: 'Dispatcher or manager reviewing rental dates and location telematics.' },
  { id: 'TS-3', name: 'Assigned', stage: 'Matched', chargeable: true, description: 'Matched to rental contract; pending managerial charging action.' },
  { id: 'TS-4', name: 'Charged', stage: 'Billing', chargeable: true, description: 'Charged to driver account balance with processing fee.' },
  { id: 'TS-5', name: 'Paid', stage: 'Settled', chargeable: false, description: 'Fine paid in full to municipal issuing authority and settled with driver.' },
  { id: 'TS-6', name: 'Disputed', stage: 'Adjudication', chargeable: false, description: 'Driver or operator contested infraction with city hearing office.' }
];

async function upsertSetting(key, val, desc) {
  const existing = await db('settings').where({ setting_key: key }).first();
  if (existing) {
    await db('settings')
      .where({ setting_key: key })
      .update({
        setting_value: String(val),
        updated_at: db.fn.now()
      });
  } else {
    await db('settings').insert({
      setting_key: key,
      setting_value: String(val),
      description: desc,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  }
}

async function getGeneralSettings() {
  const rows = await db('settings').select('*');
  const map = {};
  rows.forEach((r) => {
    map[r.setting_key] = r.setting_value;
  });

  return {
    company: {
      name: map['company_name'] || 'PrimeRoute Global Fleet Systems',
      tagline: map['company_tagline'] || 'Manage • Track • Grow',
      email: map['company_email'] || 'admin@primeroute.io',
      phone: map['company_phone'] || '+1 (800) 555-ROUT',
      website: map['company_website'] || 'https://primeroute.io',
      taxId: map['company_tax_id'] || 'US-EIN-948210382',
      address: map['company_address'] || '500 Madison Ave, Floor 24, New York, NY 10022',
      currency: map['currency'] || 'USD ($)',
      oilChangeInterval: Number(map['oil_change_interval_miles']) || 5000,
      logo: map['company_logo'] || '/primeroute-logo.png',
    },
    maintenanceIntervals: {
      oilChangeMiles: Number(map['oil_change_interval_miles']) || 5000,
    },
    raw: map
  };
}

async function updateGeneralSettings(data) {
  const company = data.company || data;
  const updates = [
    { key: 'company_name', val: company.name, desc: 'Official registered company business name' },
    { key: 'company_tagline', val: company.tagline, desc: 'Company slogan or tagline' },
    { key: 'company_email', val: company.email, desc: 'Primary customer support and operations email' },
    { key: 'company_phone', val: company.phone, desc: 'Primary customer service phone number' },
    { key: 'company_website', val: company.website, desc: 'Official fleet website url' },
    { key: 'company_tax_id', val: company.taxId, desc: 'Federal employer tax ID (EIN)' },
    { key: 'company_address', val: company.address, desc: 'Principal headquarters physical address' },
    { key: 'company_logo', val: company.logo, desc: 'Corporate logo data URL or path' },
    { key: 'currency', val: company.currency, desc: 'Default operational currency' },
    {
      key: 'oil_change_interval_miles',
      val: String(company.oilChangeInterval || data.maintenanceIntervals?.oilChangeMiles || 5000),
      desc: 'Standard routine oil change mileage threshold'
    }
  ];

  for (const item of updates) {
    if (item.val !== undefined && item.val !== null) {
      await upsertSetting(item.key, item.val, item.desc);
    }
  }

  // Also support saving statuses & categories if provided in general payload
  if (data.vehicleStatuses || data.vehicle_statuses) {
    const val = data.vehicleStatuses || data.vehicle_statuses;
    await upsertSetting('vehicle_statuses', typeof val === 'string' ? val : JSON.stringify(val), 'Controlled vehicle fleet statuses list');
  }
  if (data.expenseCategories || data.expense_categories) {
    const val = data.expenseCategories || data.expense_categories;
    await upsertSetting('expense_categories', typeof val === 'string' ? val : JSON.stringify(val), 'Controlled accounting expense categories');
  }
  if (data.ticketStatuses || data.ticket_statuses) {
    const val = data.ticketStatuses || data.ticket_statuses;
    await upsertSetting('ticket_statuses', typeof val === 'string' ? val : JSON.stringify(val), 'Controlled citation workflow stages');
  }

  return getGeneralSettings();
}

async function getStatusesAndCategories() {
  const rows = await db('settings')
    .whereIn('setting_key', ['vehicle_statuses', 'expense_categories', 'ticket_statuses'])
    .select('*');

  const map = {};
  rows.forEach((r) => {
    map[r.setting_key] = r.setting_value;
  });

  let vehicleStatuses = DEFAULT_VEHICLE_STATUSES;
  let expenseCategories = DEFAULT_EXPENSE_CATEGORIES;
  let ticketStatuses = DEFAULT_TICKET_STATUSES;

  if (map['vehicle_statuses']) {
    try {
      vehicleStatuses = JSON.parse(map['vehicle_statuses']);
    } catch (e) {
      vehicleStatuses = DEFAULT_VEHICLE_STATUSES;
    }
  } else {
    await upsertSetting('vehicle_statuses', JSON.stringify(DEFAULT_VEHICLE_STATUSES), 'Controlled vehicle fleet statuses list');
  }

  if (map['expense_categories']) {
    try {
      expenseCategories = JSON.parse(map['expense_categories']);
    } catch (e) {
      expenseCategories = DEFAULT_EXPENSE_CATEGORIES;
    }
  } else {
    await upsertSetting('expense_categories', JSON.stringify(DEFAULT_EXPENSE_CATEGORIES), 'Controlled accounting expense categories');
  }

  if (map['ticket_statuses']) {
    try {
      ticketStatuses = JSON.parse(map['ticket_statuses']);
    } catch (e) {
      ticketStatuses = DEFAULT_TICKET_STATUSES;
    }
  } else {
    await upsertSetting('ticket_statuses', JSON.stringify(DEFAULT_TICKET_STATUSES), 'Controlled citation workflow stages');
  }

  return {
    vehicleStatuses,
    expenseCategories,
    ticketStatuses
  };
}

async function updateStatusesAndCategories(data) {
  if (data.vehicleStatuses) {
    await upsertSetting('vehicle_statuses', JSON.stringify(data.vehicleStatuses), 'Controlled vehicle fleet statuses list');
  }
  if (data.expenseCategories) {
    await upsertSetting('expense_categories', JSON.stringify(data.expenseCategories), 'Controlled accounting expense categories');
  }
  if (data.ticketStatuses) {
    await upsertSetting('ticket_statuses', JSON.stringify(data.ticketStatuses), 'Controlled citation workflow stages');
  }
  return getStatusesAndCategories();
}

async function addVehicleStatus(item) {
  const data = await getStatusesAndCategories();
  const list = data.vehicleStatuses || [];
  const newItem = {
    id: item.id || `VS-${Date.now()}`,
    name: item.name,
    color: item.color || 'blue',
    description: item.description || '',
    canRent: Boolean(item.canRent),
    canIntake: Boolean(item.canIntake),
    isSystem: Boolean(item.isSystem)
  };
  list.push(newItem);
  await upsertSetting('vehicle_statuses', JSON.stringify(list), 'Controlled vehicle fleet statuses list');
  return list;
}

async function deleteVehicleStatus(id) {
  const data = await getStatusesAndCategories();
  const list = (data.vehicleStatuses || []).filter((v) => v.id !== id);
  await upsertSetting('vehicle_statuses', JSON.stringify(list), 'Controlled vehicle fleet statuses list');
  return list;
}

async function addExpenseCategory(item) {
  const data = await getStatusesAndCategories();
  const list = data.expenseCategories || [];
  const newItem = {
    id: item.id || `EC-${Date.now()}`,
    code: item.code ? item.code.toUpperCase() : `EXP-${item.name.slice(0, 3).toUpperCase()}`,
    name: item.name ? item.name.toLowerCase() : '',
    taxDeductible: Boolean(item.taxDeductible),
    requiresApproval: Boolean(item.requiresApproval),
    status: item.status || 'Active'
  };
  list.push(newItem);
  await upsertSetting('expense_categories', JSON.stringify(list), 'Controlled accounting expense categories');
  return list;
}

async function deleteExpenseCategory(id) {
  const data = await getStatusesAndCategories();
  const list = (data.expenseCategories || []).filter((v) => v.id !== id && v.code !== id);
  await upsertSetting('expense_categories', JSON.stringify(list), 'Controlled accounting expense categories');
  return list;
}

async function addTicketStatus(item) {
  const data = await getStatusesAndCategories();
  const list = data.ticketStatuses || [];
  const newItem = {
    id: item.id || `TS-${Date.now()}`,
    name: item.name,
    stage: item.stage || 'Review',
    chargeable: Boolean(item.chargeable),
    description: item.description || ''
  };
  list.push(newItem);
  await upsertSetting('ticket_statuses', JSON.stringify(list), 'Controlled citation workflow stages');
  return list;
}

async function deleteTicketStatus(id) {
  const data = await getStatusesAndCategories();
  const list = (data.ticketStatuses || []).filter((v) => v.id !== id);
  await upsertSetting('ticket_statuses', JSON.stringify(list), 'Controlled citation workflow stages');
  return list;
}

async function getAllSettings() {
  return db('settings').select('*');
}

module.exports = {
  getGeneralSettings,
  updateGeneralSettings,
  getStatusesAndCategories,
  updateStatusesAndCategories,
  addVehicleStatus,
  deleteVehicleStatus,
  addExpenseCategory,
  deleteExpenseCategory,
  addTicketStatus,
  deleteTicketStatus,
  getAllSettings
};
