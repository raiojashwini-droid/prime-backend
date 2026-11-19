const db = require('../../config/db');

/**
 * Format DB row into clean frontend schema
 */
function formatRecord(r) {
  if (!r) return null;

  const statusMap = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  // Derive service category from service_type (Electric vehicle & battery prioritized)
  let category = 'Mechanical';
  const typeLower = (r.service_type || '').toLowerCase();
  if (typeLower.includes('battery') || typeLower.includes('ev') || typeLower.includes('charging') || typeLower.includes('coolant')) {
    category = 'EV & Electrical';
  } else if (typeLower.includes('oil') || typeLower.includes('synthetic 0w') || typeLower.includes('lube')) {
    category = 'Oil & Filter';
  } else if (typeLower.includes('brake') || typeLower.includes('pad') || typeLower.includes('rotor')) {
    category = 'Brakes & Hydraulics';
  } else if (typeLower.includes('tire') || typeLower.includes('alignment') || typeLower.includes('balancing')) {
    category = 'Tires & Alignment';
  } else if (typeLower.includes('transmission') || typeLower.includes('gearbox')) {
    category = 'Transmission';
  } else if (typeLower.includes('inspection') || typeLower.includes('safety') || typeLower.includes('belt')) {
    category = 'Inspection & Belts';
  } else if (typeLower.includes('a/c') || typeLower.includes('air') || typeLower.includes('refrigerant') || typeLower.includes('hepa') || typeLower.includes('cabin')) {
    category = 'HVAC & Climate';
  }

  const cleanOdo = Number(r.odometer || 0);
  const cleanNextOdo = Number(r.next_service_odometer || cleanOdo + 5000);

  return {
    rawId: r.id,
    id: `MNT-${String(r.id).padStart(3, '0')}`,
    vehicleId: r.vehicle_id,
    vehicle: r.vehicle_make && r.vehicle_model
      ? `${r.vehicle_make} ${r.vehicle_model} (${r.vehicle_plate || 'PR-FLEET'})`
      : `Fleet Vehicle #${r.vehicle_id}`,
    plate: r.vehicle_plate || 'PR-FLEET',
    vehicleStatus: r.vehicle_status || 'available',
    type: r.service_type,
    category,
    serviceDate: r.service_date ? new Date(r.service_date).toISOString().split('T')[0] : '',
    odometer: cleanOdo,
    mileage: `${cleanOdo.toLocaleString()} mi`,
    nextServiceMileage: cleanNextOdo,
    nextServiceDate: r.next_service_date ? new Date(r.next_service_date).toISOString().split('T')[0] : '',
    provider: r.vendor_name || 'Fleet Workshop Partner',
    vendorId: r.vendor_id || null,
    cost: Number(r.cost || 0),
    status: statusMap[r.status] || r.status || 'Scheduled',
    dbStatus: r.status,
    invoiceUpload: r.invoice_url || null,
    notes: r.description || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

/**
 * Base query joining vehicles and vendors
 */
function getBaseQuery() {
  return db('maintenance_records')
    .leftJoin('vehicles', 'maintenance_records.vehicle_id', 'vehicles.id')
    .leftJoin('vendors', 'maintenance_records.vendor_id', 'vendors.id')
    .select(
      'maintenance_records.*',
      'vehicles.make as vehicle_make',
      'vehicles.model as vehicle_model',
      'vehicles.year as vehicle_year',
      'vehicles.plate as vehicle_plate',
      'vehicles.status as vehicle_status',
      'vehicles.mileage as vehicle_current_mileage',
      'vendors.name as vendor_name',
      'vendors.service_type as vendor_service_type'
    );
}

/**
 * Get all maintenance records with filters
 */
async function getAllMaintenanceRecords(filters = {}) {
  let query = getBaseQuery().orderBy('maintenance_records.service_date', 'desc').orderBy('maintenance_records.id', 'desc');

  if (filters.vehicleId) {
    query = query.where('maintenance_records.vehicle_id', filters.vehicleId);
  }

  if (filters.status && filters.status !== 'all') {
    const s = filters.status.toLowerCase();
    if (s === 'scheduled') query = query.where('maintenance_records.status', 'scheduled');
    else if (s === 'inprogress' || s === 'in_progress') query = query.where('maintenance_records.status', 'in_progress');
    else if (s === 'completed') query = query.where('maintenance_records.status', 'completed');
    else if (s === 'cancelled') query = query.where('maintenance_records.status', 'cancelled');
  }

  if (filters.search) {
    const q = `%${filters.search.toLowerCase()}%`;
    query = query.where(function () {
      this.whereRaw('LOWER(vehicles.make) LIKE ?', [q])
        .orWhereRaw('LOWER(vehicles.model) LIKE ?', [q])
        .orWhereRaw('LOWER(vehicles.plate) LIKE ?', [q])
        .orWhereRaw('LOWER(vendors.name) LIKE ?', [q])
        .orWhereRaw('LOWER(maintenance_records.service_type) LIKE ?', [q])
        .orWhereRaw('LOWER(maintenance_records.description) LIKE ?', [q]);
    });
  }

  const rows = await query;
  return rows.map(formatRecord);
}

/**
 * Get single maintenance record by ID
 */
async function getMaintenanceById(id) {
  const numId = typeof id === 'string' && id.startsWith('MNT-') ? parseInt(id.replace('MNT-', ''), 10) : parseInt(id, 10);
  if (!numId || isNaN(numId)) {
    const err = new Error(`Maintenance record #${id} not found`);
    err.status = 404;
    throw err;
  }
  const row = await getBaseQuery().where('maintenance_records.id', numId).first();
  if (!row) {
    const err = new Error(`Maintenance record #${id} not found`);
    err.status = 404;
    throw err;
  }
  return formatRecord(row);
}

/**
 * Get live maintenance KPI statistics
 */
async function getMaintenanceStats() {
  const records = await getAllMaintenanceRecords();
  const todayStr = new Date().toISOString().split('T')[0];

  let overdueCount = 0;
  let dueSoonCount = 0;
  let scheduledCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  let totalCost = 0;

  records.forEach((r) => {
    totalCost += Number(r.cost || 0);

    if (r.status === 'Completed') {
      completedCount++;
      return;
    }
    if (r.status === 'In Progress') {
      inProgressCount++;
      return;
    }

    const targetDate = r.serviceDate || r.nextServiceDate;
    const isPastDate = targetDate && targetDate < todayStr;
    const currentMiles = Number(r.odometer || 0);
    const nextMiles = Number(r.nextServiceMileage || 0);

    if (isPastDate || (nextMiles > 0 && currentMiles >= nextMiles)) {
      overdueCount++;
    } else {
      const diffDays = targetDate
        ? Math.ceil((new Date(targetDate) - new Date(todayStr)) / (1000 * 60 * 60 * 24))
        : 999;
      if (diffDays <= 14 || (nextMiles > 0 && nextMiles - currentMiles <= 500)) {
        dueSoonCount++;
      } else {
        scheduledCount++;
      }
    }
  });

  return {
    overdueCount,
    dueSoonCount,
    scheduledCount,
    inProgressCount,
    completedCount,
    totalCost,
    totalRecords: records.length
  };
}

/**
 * Resolve vehicle ID from various input formats
 */
async function resolveVehicleId(input) {
  if (!input) return null;
  if (typeof input === 'number') return input;

  let str = String(input).trim();

  // 1. Check if formatted as VEH-002, VEH-2, etc.
  if (str.toUpperCase().startsWith('VEH-')) {
    const numPart = str.toUpperCase().replace('VEH-', '').trim();
    if (/^\d+$/.test(numPart)) {
      const parsedId = parseInt(numPart, 10);
      const byId = await db('vehicles').where({ id: parsedId }).first();
      if (byId) return byId.id;
    }
  }

  // 2. Check if pure numeric (e.g. "2" or 2)
  if (/^\d+$/.test(str)) {
    const parsedId = parseInt(str, 10);
    const byId = await db('vehicles').where({ id: parsedId }).first();
    if (byId) return byId.id;
  }

  // 3. Check plate match (e.g. "PR-2024-HA")
  const byPlate = await db('vehicles').whereRaw('LOWER(plate) = ?', [str.toLowerCase()]).first();
  if (byPlate) return byPlate.id;

  // 4. Check make/model match (e.g. "Honda Accord")
  const byName = await db('vehicles')
    .whereRaw("LOWER(CONCAT(make, ' ', model)) LIKE ?", [`%${str.toLowerCase()}%`])
    .first();
  if (byName) return byName.id;

  return null;
}

/**
 * Resolve vendor ID from name or ID
 */
async function resolveVendorId(input) {
  if (!input) return null;
  if (typeof input === 'number') return input;

  const str = String(input).trim();
  if (/^\d+$/.test(str)) return parseInt(str, 10);

  const vendor = await db('vendors').whereRaw('LOWER(name) LIKE ?', [`%${str.toLowerCase()}%`]).first();
  return vendor ? vendor.id : null;
}

/**
 * Create a new maintenance record in MySQL
 */
async function createMaintenanceRecord(data, userId = null) {
  let vehicleId = await resolveVehicleId(data.vehicleId || data.vehicle || data.plate);
  if (!vehicleId) {
    const firstVeh = await db('vehicles').first();
    vehicleId = firstVeh ? firstVeh.id : 1;
  }

  const vendorId = await resolveVendorId(data.vendorId || data.provider);

  const statusInput = (data.status || 'scheduled').toLowerCase().replace(' ', '_');
  const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  const dbStatus = validStatuses.includes(statusInput) ? statusInput : 'scheduled';

  const odo = Number(data.odometer || 0);
  const nextOdo = Number(data.nextServiceMileage || odo + 5000);
  const cost = Number(data.cost || 0);

  const insertData = {
    vehicle_id: vehicleId,
    vendor_id: vendorId,
    service_date: data.serviceDate || new Date().toISOString().split('T')[0],
    odometer: odo,
    service_type: data.type || data.serviceType || 'Oil Change - 5,000 miles',
    description: data.notes || data.description || '',
    cost,
    invoice_url: data.invoiceUpload || data.invoiceUrl || null,
    next_service_odometer: nextOdo,
    next_service_date: data.nextServiceDate || null,
    status: dbStatus
  };

  const [id] = await db('maintenance_records').insert(insertData);

  // If vehicle should be pulled from intake or job is In Progress, mark vehicle as maintenance
  if (data.pullFromIntake || dbStatus === 'in_progress') {
    await db('vehicles').where({ id: vehicleId }).update({
      status: 'maintenance',
      updated_at: db.fn.now()
    });
  }

  // Optionally log expense in accounting ledger if cost > 0
  if (cost > 0 && (data.logExpense || dbStatus === 'completed')) {
    try {
      await db('expenses').insert({
        vehicle_id: vehicleId,
        vendor_id: vendorId,
        recorded_by: userId || 1,
        category: 'repairs',
        amount: cost,
        expense_date: insertData.service_date,
        payment_method: 'corporate_card',
        invoice_receipt_url: insertData.invoice_url,
        description: `Fleet Maintenance: ${insertData.service_type} for Vehicle #${vehicleId}`,
        status: 'approved'
      });
    } catch (expErr) {
      console.warn('Expense auto-log notice:', expErr.message);
    }
  }

  return getMaintenanceById(id);
}

/**
 * Update an existing maintenance record
 */
async function updateMaintenanceRecord(id, updates) {
  const numId = typeof id === 'string' && id.startsWith('MNT-') ? parseInt(id.replace('MNT-', ''), 10) : parseInt(id, 10);
  if (!numId || isNaN(numId)) {
    const err = new Error(`Maintenance record #${id} not found`);
    err.status = 404;
    throw err;
  }
  const existing = await db('maintenance_records').where({ id: numId }).first();
  if (!existing) {
    const err = new Error(`Maintenance record #${id} not found`);
    err.status = 404;
    throw err;
  }

  const patch = { updated_at: db.fn.now() };

  if (updates.serviceType || updates.type) patch.service_type = updates.serviceType || updates.type;
  if (updates.serviceDate) patch.service_date = updates.serviceDate;
  if (updates.odometer !== undefined) patch.odometer = Number(updates.odometer);
  if (updates.nextServiceMileage !== undefined) patch.next_service_odometer = Number(updates.nextServiceMileage);
  if (updates.nextServiceDate !== undefined) patch.next_service_date = updates.nextServiceDate;
  if (updates.cost !== undefined) patch.cost = Number(updates.cost);
  if (updates.notes !== undefined || updates.description !== undefined) {
    patch.description = updates.notes !== undefined ? updates.notes : updates.description;
  }
  if (updates.invoiceUpload !== undefined || updates.invoiceUrl !== undefined) {
    patch.invoice_url = updates.invoiceUpload !== undefined ? updates.invoiceUpload : updates.invoiceUrl;
  }

  if (updates.status) {
    const s = updates.status.toLowerCase().replace(' ', '_');
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (validStatuses.includes(s)) {
      patch.status = s;
    }
  }

  if (updates.vehicleId) {
    const vId = await resolveVehicleId(updates.vehicleId);
    if (vId) patch.vehicle_id = vId;
  }

  if (updates.vendorId || updates.provider) {
    const vendId = await resolveVendorId(updates.vendorId || updates.provider);
    if (vendId) patch.vendor_id = vendId;
  }

  await db('maintenance_records').where({ id: numId }).update(patch);

  // If status changed to completed, update vehicle mileage and restore available status if needed
  if (patch.status === 'completed') {
    const targetVehId = patch.vehicle_id || existing.vehicle_id;
    const veh = await db('vehicles').where({ id: targetVehId }).first();
    if (veh) {
      const vehUpdate = {};
      if (patch.odometer && patch.odometer > (veh.mileage || 0)) {
        vehUpdate.mileage = patch.odometer;
      }
      if (veh.status === 'maintenance') {
        vehUpdate.status = 'available';
      }
      if (Object.keys(vehUpdate).length > 0) {
        vehUpdate.updated_at = db.fn.now();
        await db('vehicles').where({ id: targetVehId }).update(vehUpdate);
      }
    }
  } else if (patch.status === 'in_progress') {
    const targetVehId = patch.vehicle_id || existing.vehicle_id;
    await db('vehicles').where({ id: targetVehId }).update({
      status: 'maintenance',
      updated_at: db.fn.now()
    });
  }

  return getMaintenanceById(numId);
}

/**
 * Delete a maintenance record
 */
async function deleteMaintenanceRecord(id) {
  const numId = typeof id === 'string' && id.startsWith('MNT-') ? parseInt(id.replace('MNT-', ''), 10) : parseInt(id, 10);
  if (!numId || isNaN(numId)) {
    const err = new Error(`Maintenance record #${id} not found`);
    err.status = 404;
    throw err;
  }
  const deletedCount = await db('maintenance_records').where({ id: numId }).del();
  if (deletedCount === 0) {
    const err = new Error(`Maintenance record #${id} not found`);
    err.status = 404;
    throw err;
  }
  return { success: true, message: `Maintenance record #${id} deleted` };
}

/**
 * Toggle vehicle status between 'available' and 'maintenance' / 'unavailable'
 */
async function toggleVehicleAvailability(vehicleId, targetStatus = null) {
  const vId = await resolveVehicleId(vehicleId);
  if (!vId) {
    const err = new Error(`Vehicle "${vehicleId}" not found`);
    err.status = 404;
    throw err;
  }

  const veh = await db('vehicles').where({ id: vId }).first();
  if (!veh) {
    const err = new Error(`Vehicle #${vId} not found`);
    err.status = 404;
    throw err;
  }

  let nextStatus = targetStatus;
  if (!nextStatus) {
    nextStatus = veh.status === 'maintenance' || veh.status === 'unavailable' ? 'available' : 'maintenance';
  }

  await db('vehicles').where({ id: vId }).update({
    status: nextStatus,
    updated_at: db.fn.now()
  });

  return {
    vehicleId: vId,
    plate: veh.plate,
    previousStatus: veh.status,
    currentStatus: nextStatus
  };
}

module.exports = {
  getAllMaintenanceRecords,
  getMaintenanceById,
  getMaintenanceStats,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  toggleVehicleAvailability
};
