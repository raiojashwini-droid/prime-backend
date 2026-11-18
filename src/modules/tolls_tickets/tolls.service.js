const db = require('../../config/db');

/**
 * Map DB status to Frontend UI status
 */
const STATUS_MAP = {
  unassigned: 'Unassigned',
  under_review: 'Under Review',
  assigned: 'Assigned',
  charged: 'Charged',
  paid: 'Paid',
  disputed: 'Disputed'
};

const REVERSE_STATUS_MAP = {
  'Unassigned': 'unassigned',
  'Under Review': 'under_review',
  'Assigned': 'assigned',
  'Charged': 'charged',
  'Paid': 'paid',
  'Disputed': 'disputed'
};

/**
 * Format DB row into clean frontend schema
 */
function formatRecord(r) {
  if (!r) return null;

  const fineAmt = Number(r.amount || 0);
  const adminFee = Number(r.admin_fee !== null && r.admin_fee !== undefined ? r.admin_fee : 15);
  const driverCharge = Number(r.driver_charge !== null && r.driver_charge !== undefined ? r.driver_charge : fineAmt + adminFee);
  const balance = r.status === 'paid' ? 0 : Number(r.balance !== null && r.balance !== undefined ? r.balance : driverCharge);

  const vehicleName = r.vehicle_make && r.vehicle_model
    ? `${r.vehicle_make} ${r.vehicle_model} (${r.vehicle_plate || 'PR-FLEET'})`
    : `Fleet Vehicle #${r.vehicle_id}`;

  const driverName = r.driver_first_name
    ? `${r.driver_first_name} ${r.driver_last_name}`
    : (r.driver_name_override || 'Unassigned / Outside Rental');

  const contractNo = r.contract_number || r.rental_contract_no || (r.rental_id ? `RNT-2024-${String(r.rental_id).padStart(3, '0')}` : 'N/A');

  return {
    rawId: r.id,
    id: `TCK-${String(r.id).padStart(4, '0')}`,
    ticketNumber: r.violation_number,
    referenceNumber: r.violation_number,
    issuingAuthority: r.issuing_authority,
    vehicle: vehicleName,
    vehicleId: r.vehicle_id,
    plate: r.vehicle_plate || 'PR-FLEET',
    driver: driverName,
    driverId: r.driver_id || null,
    contract: contractNo,
    contractId: contractNo,
    rentalId: r.rental_id || null,
    type: r.violation_type || 'Parking Violation',
    location: r.location || '',
    incurredDate: r.violation_date ? new Date(r.violation_date).toISOString().split('T')[0] : '',
    receivedDate: r.received_date ? new Date(r.received_date).toISOString().split('T')[0] : '',
    date: r.violation_date ? new Date(r.violation_date).toISOString().split('T')[0] : '',
    fineAmount: fineAmt,
    amount: fineAmt,
    adminFee,
    driverCharge,
    balance,
    dueDate: r.due_date ? new Date(r.due_date).toISOString().split('T')[0] : '',
    status: STATUS_MAP[r.status] || r.status || 'Assigned',
    dbStatus: r.status,
    chargedToDriver: Boolean(r.driver_charged),
    proofFileName: r.proof_file_name || null,
    proofUrl: r.proof_file_url || null,
    proofFileSize: r.proof_file_size || null,
    notes: r.notes || '',
    isToll: Boolean(r.is_toll),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

/**
 * Base query joining vehicles, drivers, and rentals
 */
function getBaseQuery() {
  return db('tolls_tickets')
    .leftJoin('vehicles', 'tolls_tickets.vehicle_id', 'vehicles.id')
    .leftJoin('drivers', 'tolls_tickets.driver_id', 'drivers.id')
    .leftJoin('rentals', 'tolls_tickets.rental_id', 'rentals.id')
    .select(
      'tolls_tickets.*',
      'vehicles.make as vehicle_make',
      'vehicles.model as vehicle_model',
      'vehicles.year as vehicle_year',
      'vehicles.plate as vehicle_plate',
      'drivers.first_name as driver_first_name',
      'drivers.last_name as driver_last_name',
      'drivers.phone as driver_phone',
      'rentals.contract_no as rental_contract_no'
    );
}

/**
 * Get all municipal violation citations
 */
async function getAllTickets(filters = {}) {
  let query = getBaseQuery().where('tolls_tickets.is_toll', 0).orderBy('tolls_tickets.due_date', 'asc').orderBy('tolls_tickets.id', 'desc');

  if (filters.status && filters.status !== 'all') {
    const s = filters.status.toLowerCase().replace(' ', '_');
    query = query.where('tolls_tickets.status', s);
  }

  if (filters.vehicleId) {
    query = query.where('tolls_tickets.vehicle_id', filters.vehicleId);
  }

  if (filters.driverId) {
    query = query.where('tolls_tickets.driver_id', filters.driverId);
  }

  if (filters.search) {
    const q = `%${filters.search.toLowerCase()}%`;
    query = query.where(function () {
      this.whereRaw('LOWER(tolls_tickets.violation_number) LIKE ?', [q])
        .orWhereRaw('LOWER(tolls_tickets.issuing_authority) LIKE ?', [q])
        .orWhereRaw('LOWER(tolls_tickets.violation_type) LIKE ?', [q])
        .orWhereRaw('LOWER(tolls_tickets.location) LIKE ?', [q])
        .orWhereRaw('LOWER(vehicles.make) LIKE ?', [q])
        .orWhereRaw('LOWER(vehicles.model) LIKE ?', [q])
        .orWhereRaw('LOWER(vehicles.plate) LIKE ?', [q])
        .orWhereRaw('LOWER(drivers.first_name) LIKE ?', [q])
        .orWhereRaw('LOWER(drivers.last_name) LIKE ?', [q])
        .orWhereRaw('LOWER(tolls_tickets.contract_number) LIKE ?', [q]);
    });
  }

  const rows = await query;
  return rows.map(formatRecord);
}

/**
 * Get all Electronic E-ZPass toll records
 */
async function getAllTolls(filters = {}) {
  let query = getBaseQuery().where('tolls_tickets.is_toll', 1).orderBy('tolls_tickets.violation_date', 'desc');

  if (filters.search) {
    const q = `%${filters.search.toLowerCase()}%`;
    query = query.where(function () {
      this.whereRaw('LOWER(tolls_tickets.violation_number) LIKE ?', [q])
        .orWhereRaw('LOWER(tolls_tickets.location) LIKE ?', [q])
        .orWhereRaw('LOWER(vehicles.plate) LIKE ?', [q])
        .orWhereRaw('LOWER(vehicles.make) LIKE ?', [q])
        .orWhereRaw('LOWER(vehicles.model) LIKE ?', [q]);
    });
  }

  const rows = await query;
  return rows.map((r) => {
    const vehicleName = r.vehicle_make && r.vehicle_model
      ? `${r.vehicle_make} ${r.vehicle_model} (${r.vehicle_plate || 'PR-FLEET'})`
      : `Fleet Vehicle #${r.vehicle_id}`;

    return {
      rawId: r.id,
      id: r.violation_number || `TOL-${r.id}`,
      vehicle: vehicleName,
      vehicleId: r.vehicle_id,
      plate: r.vehicle_plate,
      tollLocation: r.location || r.issuing_authority || 'Toll Plaza',
      date: r.violation_date
        ? new Date(r.violation_date).toISOString().replace('T', ' ').substring(0, 16)
        : '',
      amount: Number(r.amount || 0),
      status: 'Paid',
      notes: r.notes || ''
    };
  });
}

/**
 * Get Live Tolls & Violations KPI Statistics
 */
async function getStats() {
  const todayStr = new Date().toISOString().split('T')[0];

  const citations = await getAllTickets();
  const tolls = await getAllTolls();

  // 1. Overdue Citations (due_date < today && status !== 'Paid')
  const overdueList = citations.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'Paid'
  );
  const overdueAmount = overdueList.reduce(
    (sum, t) => sum + Number(t.fineAmount || 0),
    0
  );

  // 2. Unresolved Violations (Unassigned, Under Review, Assigned, Disputed)
  const unresolvedList = citations.filter(
    (t) =>
      t.status === 'Unassigned' ||
      t.status === 'Under Review' ||
      t.status === 'Assigned' ||
      t.status === 'Disputed'
  );
  const unresolvedAmount = unresolvedList.reduce(
    (sum, t) => sum + Number(t.fineAmount || 0),
    0
  );

  // 3. Driver Recoveries (Charged or Paid)
  const chargedList = citations.filter(
    (t) => t.status === 'Charged' || t.chargedToDriver === true || t.status === 'Paid'
  );
  const chargedAmount = chargedList.reduce(
    (sum, t) => sum + Number(t.driverCharge || 0),
    0
  );

  // 4. E-ZPass Toll Summary
  const tollTotal = tolls.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return {
    overdueCount: overdueList.length,
    overdueAmount,
    unresolvedCount: unresolvedList.length,
    unresolvedAmount,
    chargedCount: chargedList.length,
    chargedAmount,
    tollCount: tolls.length,
    tollTotal,
    totalTickets: citations.length
  };
}

/**
 * Resolve Vehicle ID from string or object
 */
async function resolveVehicleId(input) {
  if (!input) return null;
  if (typeof input === 'number') return input;

  const str = String(input).trim();
  if (str.toUpperCase().startsWith('VEH-')) {
    const num = parseInt(str.toUpperCase().replace('VEH-', ''), 10);
    if (!isNaN(num)) {
      const v = await db('vehicles').where({ id: num }).first();
      if (v) return v.id;
    }
  }

  if (/^\d+$/.test(str)) {
    const v = await db('vehicles').where({ id: parseInt(str, 10) }).first();
    if (v) return v.id;
  }

  const byPlate = await db('vehicles').whereRaw('LOWER(plate) = ?', [str.toLowerCase()]).first();
  if (byPlate) return byPlate.id;

  const byName = await db('vehicles')
    .whereRaw("LOWER(CONCAT(make, ' ', model)) LIKE ?", [`%${str.toLowerCase()}%`])
    .first();
  if (byName) return byName.id;

  return null;
}

/**
 * Resolve Driver ID from string or name
 */
async function resolveDriverId(input) {
  if (!input) return null;
  if (typeof input === 'number') return input;

  const str = String(input).trim();
  if (str.toUpperCase().startsWith('DRV-')) {
    const num = parseInt(str.toUpperCase().replace('DRV-', ''), 10);
    if (!isNaN(num)) {
      const d = await db('drivers').where({ id: num }).first();
      if (d) return d.id;
    }
  }

  if (/^\d+$/.test(str)) {
    const d = await db('drivers').where({ id: parseInt(str, 10) }).first();
    if (d) return d.id;
  }

  const byName = await db('drivers')
    .whereRaw("LOWER(CONCAT(first_name, ' ', last_name)) LIKE ?", [`%${str.toLowerCase()}%`])
    .first();
  if (byName) return byName.id;

  return null;
}

/**
 * Auto-match Driver and Rental based on vehicle and violation date
 */
async function findActiveRentalForVehicle(vehicleId, violationDate) {
  if (!vehicleId) return null;
  const targetDate = violationDate || new Date().toISOString().split('T')[0];

  const rental = await db('rentals')
    .where('vehicle_id', vehicleId)
    .where('start_date', '<=', targetDate)
    .andWhere(function () {
      this.whereNull('end_date').orWhere('end_date', '>=', targetDate);
    })
    .orderBy('start_date', 'desc')
    .first();

  if (rental) return rental;

  // Fallback: Latest active rental for this vehicle
  return db('rentals')
    .where({ vehicle_id: vehicleId, status: 'active' })
    .orderBy('id', 'desc')
    .first();
}

/**
 * Get ticket by ID
 */
async function getTicketById(id) {
  const numId = typeof id === 'string' && id.startsWith('TCK-')
    ? parseInt(id.replace('TCK-', ''), 10)
    : parseInt(id, 10);

  const row = await getBaseQuery().where('tolls_tickets.id', numId).first();
  if (!row) {
    const err = new Error(`Citation record #${id} not found`);
    err.status = 404;
    throw err;
  }
  return formatRecord(row);
}

/**
 * Create a new citation ticket
 */
async function createTicket(data) {
  let vehicleId = await resolveVehicleId(data.vehicleId || data.vehicle || data.vehiclePlate);
  if (!vehicleId) {
    const firstVeh = await db('vehicles').first();
    vehicleId = firstVeh ? firstVeh.id : 1;
  }

  let driverId = await resolveDriverId(data.driverId || data.driver);
  let rentalId = data.rentalId || null;
  let contractNo = data.contract || data.contractNumber || null;

  // If driver not explicitly provided, attempt automated matching
  if (!driverId) {
    const matchedRental = await findActiveRentalForVehicle(vehicleId, data.incurredDate || data.violationDate);
    if (matchedRental) {
      driverId = matchedRental.driver_id;
      rentalId = matchedRental.id;
      contractNo = matchedRental.contract_no;
    }
  }

  // Validate driver and rental foreign keys exist in DB to prevent foreign key errors
  if (driverId) {
    const validDriver = await db('drivers').where({ id: driverId }).first();
    if (!validDriver) driverId = null;
  }

  if (rentalId) {
    const validRental = await db('rentals').where({ id: rentalId }).first();
    if (!validRental) rentalId = null;
  } else if (contractNo && contractNo !== 'N/A') {
    const validRental = await db('rentals').where({ contract_no: contractNo }).first();
    if (validRental) rentalId = validRental.id;
  }

  const fineAmt = Number(data.amount || data.fineAmount || 75);
  const adminFee = Number(data.adminFee !== undefined ? data.adminFee : 15);
  const driverCharge = Number(data.driverCharge || fineAmt + adminFee);
  const balance = Number(data.balance !== undefined ? data.balance : driverCharge);

  const statusInput = (data.status || 'Assigned').toLowerCase().replace(' ', '_');
  const dbStatus = STATUS_MAP[statusInput] ? statusInput : 'assigned';

  const violationNumber = data.referenceNumber || data.ticketNumber || `VIOL-${Date.now().toString().slice(-6)}`;

  const insertData = {
    vehicle_id: vehicleId,
    driver_id: driverId,
    rental_id: rentalId,
    contract_number: contractNo,
    violation_number: violationNumber,
    violation_date: data.incurredDate || data.date || data.violationDate || new Date(),
    received_date: data.receivedDate || new Date().toISOString().split('T')[0],
    issuing_authority: data.issuingAuthority || 'NYC Department of Finance (DOF)',
    violation_type: data.type || 'Parking Violation (Street Sweeping / No Standing)',
    location: data.location || '',
    amount: fineAmt,
    admin_fee: adminFee,
    driver_charge: driverCharge,
    balance: dbStatus === 'paid' ? 0 : balance,
    due_date: data.dueDate || null,
    status: dbStatus,
    driver_charged: Boolean(data.chargedToDriver || dbStatus === 'charged' || dbStatus === 'paid'),
    proof_file_name: data.proofFileName || (data.paymentProofUpload ? data.paymentProofUpload.name : null),
    proof_file_url: data.proofUrl || null,
    proof_file_size: data.proofFileSize || null,
    notes: data.notes || '',
    is_toll: Boolean(data.isToll || false)
  };

  const [id] = await db('tolls_tickets').insert(insertData);
  return getTicketById(id);
}

/**
 * Update an existing ticket
 */
async function updateTicket(id, updates) {
  const numId = typeof id === 'string' && id.startsWith('TCK-')
    ? parseInt(id.replace('TCK-', ''), 10)
    : parseInt(id, 10);

  const existing = await db('tolls_tickets').where({ id: numId }).first();
  if (!existing) {
    const err = new Error(`Citation record #${id} not found`);
    err.status = 404;
    throw err;
  }

  const patch = {};

  if (updates.vehicle || updates.vehicleId || updates.vehiclePlate) {
    const vId = await resolveVehicleId(updates.vehicleId || updates.vehicle || updates.vehiclePlate);
    if (vId) patch.vehicle_id = vId;
  }

  if (updates.driver !== undefined || updates.driverId !== undefined) {
    const dId = await resolveDriverId(updates.driverId || updates.driver);
    if (dId) {
      const validDriver = await db('drivers').where({ id: dId }).first();
      patch.driver_id = validDriver ? validDriver.id : null;
    } else {
      patch.driver_id = null;
    }
  }

  if (updates.contract !== undefined || updates.contractNumber !== undefined) {
    const cNo = updates.contract || updates.contractNumber;
    patch.contract_number = cNo;
    if (cNo && cNo !== 'N/A') {
      const validRental = await db('rentals').where({ contract_no: cNo }).first();
      patch.rental_id = validRental ? validRental.id : null;
    }
  }

  if (updates.referenceNumber || updates.ticketNumber) {
    patch.violation_number = updates.referenceNumber || updates.ticketNumber;
  }

  if (updates.issuingAuthority) patch.issuing_authority = updates.issuingAuthority;
  if (updates.type) patch.violation_type = updates.type;
  if (updates.location !== undefined) patch.location = updates.location;

  if (updates.incurredDate || updates.date) {
    patch.violation_date = updates.incurredDate || updates.date;
  }
  if (updates.receivedDate) patch.received_date = updates.receivedDate;
  if (updates.dueDate) patch.due_date = updates.dueDate;

  if (updates.amount !== undefined || updates.fineAmount !== undefined) {
    patch.amount = Number(updates.amount || updates.fineAmount);
  }
  if (updates.adminFee !== undefined) patch.admin_fee = Number(updates.adminFee);
  if (updates.driverCharge !== undefined) patch.driver_charge = Number(updates.driverCharge);
  if (updates.balance !== undefined) patch.balance = Number(updates.balance);

  if (updates.status) {
    const s = String(updates.status).toLowerCase().replace(' ', '_');
    patch.status = STATUS_MAP[s] ? s : existing.status;
    if (patch.status === 'paid') patch.balance = 0;
  }

  if (updates.chargedToDriver !== undefined) {
    patch.driver_charged = Boolean(updates.chargedToDriver);
  }

  if (updates.proofFileName !== undefined) patch.proof_file_name = updates.proofFileName;
  if (updates.proofUrl !== undefined) patch.proof_file_url = updates.proofUrl;
  if (updates.proofFileSize !== undefined) patch.proof_file_size = updates.proofFileSize;
  if (updates.notes !== undefined) patch.notes = updates.notes;

  patch.updated_at = db.fn.now();

  await db('tolls_tickets').where({ id: numId }).update(patch);
  return getTicketById(numId);
}

/**
 * Delete a citation ticket
 */
async function deleteTicket(id) {
  const numId = typeof id === 'string' && id.startsWith('TCK-')
    ? parseInt(id.replace('TCK-', ''), 10)
    : parseInt(id, 10);

  const deleted = await db('tolls_tickets').where({ id: numId }).del();
  if (deleted === 0) {
    const err = new Error(`Citation record #${id} not found`);
    err.status = 404;
    throw err;
  }
  return { success: true, message: `Citation record #${id} deleted successfully` };
}

/**
 * Transition citation through review workflow
 */
async function updateWorkflow(id, action, payload = {}) {
  const numId = typeof id === 'string' && id.startsWith('TCK-')
    ? parseInt(id.replace('TCK-', ''), 10)
    : parseInt(id, 10);

  const existing = await db('tolls_tickets').where({ id: numId }).first();
  if (!existing) {
    const err = new Error(`Citation record #${id} not found`);
    err.status = 404;
    throw err;
  }

  const patch = { updated_at: db.fn.now() };

  switch (action) {
    case 'under_review':
      patch.status = 'under_review';
      patch.notes = `${existing.notes ? existing.notes + ' | ' : ''}Placed under operational review to audit rental contract dates.`;
      break;

    case 'assign':
      patch.status = 'assigned';
      if (payload.driverId) patch.driver_id = payload.driverId;
      break;

    case 'charge_driver':
      const fine = Number(existing.amount || 0);
      const fee = Number(existing.admin_fee || 15);
      const total = fine + fee;
      patch.status = 'charged';
      patch.driver_charged = 1;
      patch.driver_charge = total;
      patch.balance = total;
      break;

    case 'mark_paid':
      patch.status = 'paid';
      patch.balance = 0;
      break;

    case 'dispute':
      patch.status = 'disputed';
      break;

    case 'resolve':
      patch.status = 'assigned';
      break;

    default:
      throw new Error(`Unsupported workflow action: ${action}`);
  }

  await db('tolls_tickets').where({ id: numId }).update(patch);
  return getTicketById(numId);
}

module.exports = {
  getAllTickets,
  getAllTolls,
  getStats,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  updateWorkflow
};
