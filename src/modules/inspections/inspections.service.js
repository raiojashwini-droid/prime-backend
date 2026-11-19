const db = require('../../config/db');

/**
 * Format an inspection row for frontend
 */
function formatInspection(row) {
  if (!row) return null;

  let checklist = {};
  try {
    checklist = typeof row.condition_checklist === 'string'
      ? JSON.parse(row.condition_checklist)
      : (row.condition_checklist || {});
  } catch (e) {
    checklist = {};
  }

  const dateObj = row.inspection_date ? new Date(row.inspection_date) : new Date();
  const dateStr = dateObj.toISOString().split('T')[0];
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const typeMap = {
    pickup: 'Check-out (Pickup)',
    return: 'Check-in (Return)',
    routine: 'Routine Fleet Audit'
  };

  return {
    id: `INS-${String(row.id).padStart(3, '0')}`,
    rawId: row.id,
    inspectionNumber: row.inspection_no || `INSP-${String(row.id).padStart(4, '0')}`,
    type: typeMap[row.inspection_type] || row.inspection_type || 'Routine Fleet Audit',
    rawType: row.inspection_type,
    contractId: row.contract_no || (row.rental_id ? `RNT-2024-${String(row.rental_id).padStart(3, '0')}` : 'N/A'),
    rentalId: row.rental_id,
    vehicle: row.vehicle_make && row.vehicle_model
      ? `${row.vehicle_make} ${row.vehicle_model}`
      : `Vehicle #${row.vehicle_id}`,
    vehicleId: row.vehicle_id ? `VEH-${String(row.vehicle_id).padStart(3, '0')}` : 'N/A',
    plate: row.vehicle_plate || 'PR-FLEET',
    driver: row.driver_first_name
      ? `${row.driver_first_name} ${row.driver_last_name || ''}`.trim()
      : 'Unassigned',
    driverId: row.driver_id ? `DRV-${String(row.driver_id).padStart(3, '0')}` : null,
    inspector: (checklist.inspector && checklist.inspector.trim()) || (row.inspector_name && row.inspector_name.trim()) || 'Marcus Brody (Fleet Tech)',
    date: dateStr,
    time: timeStr,
    odometer: Number(row.odometer || 0),
    fuelLevel: row.fuel_level ? parseInt(String(row.fuel_level).replace(/[^0-9]/g, ''), 10) || 100 : 100,
    status: row.status || 'Passed',
    exteriorCondition: checklist.exteriorCondition || 'Good',
    interiorCondition: checklist.interiorCondition || 'Clean',
    tiresCondition: checklist.tiresCondition || 'Good (8/32")',
    windshieldStatus: checklist.windshieldStatus || 'Clear / No Cracks',
    spareTirePresent: checklist.spareTirePresent !== undefined ? checklist.spareTirePresent : true,
    damageClassification: checklist.damageClassification || 'No Damage',
    existingDamage: checklist.existingDamage || 'None',
    newDamage: checklist.newDamage || 'None',
    notes: row.notes || '',
    photos: checklist.photos || [],
    driverAcknowledged: Boolean(row.driver_acknowledged),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Format an accident row for frontend
 */
function formatAccident(row) {
  if (!row) return null;

  let details = {};
  try {
    details = typeof row.details === 'string'
      ? JSON.parse(row.details)
      : (row.details || {});
  } catch (e) {
    details = {};
  }

  const dateObj = row.accident_date ? new Date(row.accident_date) : new Date();
  const dateStr = dateObj.toISOString().split('T')[0];

  const statusMap = {
    reported: 'Reported',
    under_investigation: 'Under Investigation',
    repair_pending: 'Repair Pending',
    resolved: 'Resolved'
  };

  return {
    id: `ACC-${String(row.id).padStart(3, '0')}`,
    rawId: row.id,
    incidentDate: dateStr,
    vehicle: row.vehicle_make && row.vehicle_model
      ? `${row.vehicle_make} ${row.vehicle_model}`
      : `Vehicle #${row.vehicle_id}`,
    vehicleId: row.vehicle_id ? `VEH-${String(row.vehicle_id).padStart(3, '0')}` : 'N/A',
    plate: row.vehicle_plate || 'PR-FLEET',
    driver: row.driver_first_name
      ? `${row.driver_first_name} ${row.driver_last_name || ''}`.trim()
      : 'Unassigned',
    driverId: row.driver_id ? `DRV-${String(row.driver_id).padStart(3, '0')}` : null,
    location: row.location || 'Fleet Area',
    policeReportNumber: row.police_report_no || 'N/A',
    thirdPartyInfo: details.thirdPartyInfo || 'None reported',
    damage: row.description || 'Collision damage',
    damageDescription: row.description || '',
    repairEstimate: Number(row.estimated_damage || details.repairEstimate || 0),
    repairInvoiceNumber: details.repairInvoiceNumber || 'N/A',
    repairInvoiceAmount: Number(details.repairInvoiceAmount || row.estimated_damage || 0),
    repairInvoiceFile: details.repairInvoiceFile || null,
    insuranceCarrier: details.insuranceCarrier || 'Travelers Commercial Auto',
    claimNumber: details.claimNumber || 'N/A',
    linkedPolicyId: details.linkedPolicyId || 'POL-TRV-101',
    deductibleTerms: details.deductibleTerms || '$500 Driver Deductible',
    deductibleAmount: Number(details.deductibleAmount !== undefined ? details.deductibleAmount : 500),
    driverLiabilityStatus: details.driverLiabilityStatus || 'Under Review',
    driverChargeStatus: details.driverChargeStatus || 'Pending Assessment',
    driverInvoiceNumber: details.driverInvoiceNumber || 'N/A',
    driverPaymentStatus: details.driverPaymentStatus || 'Pending',
    status: statusMap[row.status] || row.status || 'Reported',
    rawStatus: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Base Inspections Query
 */
function getInspectionsBaseQuery() {
  return db('inspections')
    .leftJoin('vehicles', 'inspections.vehicle_id', 'vehicles.id')
    .leftJoin('rentals', 'inspections.rental_id', 'rentals.id')
    .leftJoin('drivers', 'rentals.driver_id', 'drivers.id')
    .leftJoin('users', 'inspections.inspector_id', 'users.id')
    .select(
      'inspections.*',
      'vehicles.make as vehicle_make',
      'vehicles.model as vehicle_model',
      'vehicles.year as vehicle_year',
      'vehicles.plate as vehicle_plate',
      'rentals.contract_no as contract_no',
      'drivers.id as driver_id',
      'drivers.first_name as driver_first_name',
      'drivers.last_name as driver_last_name',
      'users.name as inspector_name'
    );
}

/**
 * Base Accidents Query
 */
function getAccidentsBaseQuery() {
  return db('accidents')
    .leftJoin('vehicles', 'accidents.vehicle_id', 'vehicles.id')
    .leftJoin('drivers', 'accidents.driver_id', 'drivers.id')
    .leftJoin('rentals', 'accidents.rental_id', 'rentals.id')
    .select(
      'accidents.*',
      'vehicles.make as vehicle_make',
      'vehicles.model as vehicle_model',
      'vehicles.plate as vehicle_plate',
      'drivers.first_name as driver_first_name',
      'drivers.last_name as driver_last_name'
    );
}

/**
 * Resolve vehicle ID from various input formats
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
  return null;
}

/**
 * Resolve driver ID from various input formats
 */
async function resolveDriverId(input) {
  if (!input) return null;
  if (typeof input === 'number') return input;
  const str = String(input).trim();
  if (str.toUpperCase().startsWith('DRV-')) {
    const num = parseInt(str.toUpperCase().replace('DRV-', ''), 10);
    if (!isNaN(num)) {
      if (num > 100) {
        const d = await db('drivers').where({ id: num - 100 }).first();
        if (d) return d.id;
      }
      const d = await db('drivers').where({ id: num }).first();
      if (d) return d.id;
    }
  }
  if (/^\d+$/.test(str)) {
    const d = await db('drivers').where({ id: parseInt(str, 10) }).first();
    if (d) return d.id;
  }
  const firstName = str.split(' ')[0];
  const byName = await db('drivers').whereRaw('LOWER(first_name) = ?', [firstName.toLowerCase()]).first();
  if (byName) return byName.id;
  return null;
}

/**
 * Get all inspections with filters
 */
async function getAllInspections(filters = {}) {
  let query = getInspectionsBaseQuery().orderBy('inspections.inspection_date', 'desc');

  if (filters.vehicleId) {
    const vId = await resolveVehicleId(filters.vehicleId);
    if (vId) query = query.where('inspections.vehicle_id', vId);
  }

  if (filters.status && filters.status !== 'All') {
    query = query.where('inspections.status', filters.status);
  }

  const rows = await query;
  return rows.map(formatInspection);
}

/**
 * Get inspection by ID
 */
async function getInspectionById(id) {
  const numId = typeof id === 'string' && id.startsWith('INS-')
    ? parseInt(id.replace('INS-', ''), 10)
    : parseInt(id, 10);

  const row = await getInspectionsBaseQuery().where('inspections.id', numId).first();
  if (!row) {
    const err = new Error(`Inspection #${id} not found`);
    err.status = 404;
    throw err;
  }
  return formatInspection(row);
}

/**
 * Create a new inspection
 */
async function createInspection(data, inspectorId = 1) {
  let vId = await resolveVehicleId(data.vehicleId || data.vehicle || data.plate);
  if (!vId) {
    const firstVehicle = await db('vehicles').select('id').first();
    vId = firstVehicle ? firstVehicle.id : null;
  }

  let rentalId = data.rentalId || null;
  if (!rentalId && data.contractId && data.contractId !== 'N/A') {
    const r = await db('rentals').where({ contract_no: data.contractId }).first();
    if (r) rentalId = r.id;
  }
  if (!rentalId && vId) {
    const r = await db('rentals').where({ vehicle_id: vId, status: 'active' }).first();
    if (r) rentalId = r.id;
  }

  let typeInput = (data.type || 'routine').toLowerCase();
  if (typeInput.includes('pickup') || typeInput.includes('check-out')) typeInput = 'pickup';
  else if (typeInput.includes('return') || typeInput.includes('check-in')) typeInput = 'return';
  else typeInput = 'routine';

  const checklistData = {
    exteriorCondition: data.exteriorCondition || 'Good',
    interiorCondition: data.interiorCondition || 'Clean',
    tiresCondition: data.tiresCondition || 'Good (8/32")',
    windshieldStatus: data.windshieldStatus || 'Clear / No Cracks',
    spareTirePresent: data.spareTirePresent !== undefined ? Boolean(data.spareTirePresent) : true,
    damageClassification: data.damageClassification || 'No Damage',
    existingDamage: data.existingDamage || 'None',
    newDamage: data.newDamage || 'None',
    inspector: data.inspector || 'Marcus Brody (Fleet Tech)',
    photos: data.photos || []
  };

  const [newId] = await db('inspections').insert({
    inspection_no: data.inspectionNumber || `INSP-${Math.floor(1000 + Math.random() * 9000)}`,
    vehicle_id: vId,
    rental_id: rentalId,
    inspector_id: inspectorId,
    inspection_type: typeInput,
    inspection_date: data.date ? `${data.date} 10:00:00` : db.fn.now(),
    odometer: Number(data.odometer || 0),
    fuel_level: data.fuelLevel ? `${data.fuelLevel}%` : '100%',
    status: data.status || 'Passed',
    condition_checklist: JSON.stringify(checklistData),
    notes: data.notes || '',
    driver_acknowledged: data.driverAcknowledged ? 1 : 0,
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });

  if (vId && data.odometer) {
    await db('vehicles').where({ id: vId }).update({ mileage: Number(data.odometer) }).catch(() => {});
  }

  return getInspectionById(newId);
}

/**
 * Update an existing inspection
 */
async function updateInspection(id, updates) {
  const numId = typeof id === 'string' && id.startsWith('INS-')
    ? parseInt(id.replace('INS-', ''), 10)
    : parseInt(id, 10);

  const existing = await db('inspections').where({ id: numId }).first();
  if (!existing) {
    const err = new Error(`Inspection #${id} not found`);
    err.status = 404;
    throw err;
  }

  const patch = { updated_at: db.fn.now() };
  if (updates.status) patch.status = updates.status;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.odometer !== undefined) patch.odometer = Number(updates.odometer);
  if (updates.fuelLevel !== undefined) patch.fuel_level = `${updates.fuelLevel}%`;
  if (updates.driverAcknowledged !== undefined) patch.driver_acknowledged = updates.driverAcknowledged ? 1 : 0;

  if (updates.exteriorCondition || updates.interiorCondition || updates.damageClassification || updates.newDamage || updates.photos || updates.inspector) {
    let existingChecklist = {};
    try {
      existingChecklist = JSON.parse(existing.condition_checklist || '{}');
    } catch (e) {}

    const updatedChecklist = {
      ...existingChecklist,
      ...(updates.exteriorCondition ? { exteriorCondition: updates.exteriorCondition } : {}),
      ...(updates.interiorCondition ? { interiorCondition: updates.interiorCondition } : {}),
      ...(updates.tiresCondition ? { tiresCondition: updates.tiresCondition } : {}),
      ...(updates.windshieldStatus ? { windshieldStatus: updates.windshieldStatus } : {}),
      ...(updates.spareTirePresent !== undefined ? { spareTirePresent: updates.spareTirePresent } : {}),
      ...(updates.damageClassification ? { damageClassification: updates.damageClassification } : {}),
      ...(updates.existingDamage ? { existingDamage: updates.existingDamage } : {}),
      ...(updates.newDamage ? { newDamage: updates.newDamage } : {}),
      ...(updates.inspector ? { inspector: updates.inspector } : {}),
      ...(updates.photos ? { photos: updates.photos } : {})
    };
    patch.condition_checklist = JSON.stringify(updatedChecklist);
  }

  await db('inspections').where({ id: numId }).update(patch);
  return getInspectionById(numId);
}

/**
 * Delete inspection
 */
async function deleteInspection(id) {
  const numId = typeof id === 'string' && id.startsWith('INS-')
    ? parseInt(id.replace('INS-', ''), 10)
    : parseInt(id, 10);

  const deletedCount = await db('inspections').where({ id: numId }).del();
  if (deletedCount === 0) {
    const err = new Error(`Inspection #${id} not found`);
    err.status = 404;
    throw err;
  }
  return { success: true, message: `Inspection #${id} deleted` };
}

/**
 * Get all accidents
 */
async function getAllAccidents() {
  const rows = await getAccidentsBaseQuery().orderBy('accidents.accident_date', 'desc');
  return rows.map(formatAccident);
}

/**
 * Get accident by ID
 */
async function getAccidentById(id) {
  const numId = typeof id === 'string' && id.startsWith('ACC-')
    ? parseInt(id.replace('ACC-', ''), 10)
    : parseInt(id, 10);

  const row = await getAccidentsBaseQuery().where('accidents.id', numId).first();
  if (!row) {
    const err = new Error(`Accident #${id} not found`);
    err.status = 404;
    throw err;
  }
  return formatAccident(row);
}

/**
 * Create an accident
 */
async function createAccident(data) {
  let vId = await resolveVehicleId(data.vehicleId || data.vehicle || data.plate);
  if (!vId) {
    const firstVehicle = await db('vehicles').select('id').first();
    vId = firstVehicle ? firstVehicle.id : null;
  }

  let dId = await resolveDriverId(data.driverId || data.driver);
  if (!dId && data.driver && data.driver !== 'Unassigned') {
    const matchD = await db('drivers')
      .whereRaw('LOWER(CONCAT(first_name, " ", COALESCE(last_name, ""))) LIKE ?', [`%${data.driver.toLowerCase()}%`])
      .first();
    if (matchD) dId = matchD.id;
  }

  let rentalId = data.rentalId || null;
  if (!rentalId && vId) {
    const r = await db('rentals').where({ vehicle_id: vId, status: 'active' }).first();
    if (r) rentalId = r.id;
  }

  const statusMap = {
    Reported: 'reported',
    'Under Investigation': 'under_investigation',
    'Repair Pending': 'repair_pending',
    Resolved: 'resolved',
    Settled: 'resolved'
  };

  const details = {
    thirdPartyInfo: data.thirdPartyInfo || '',
    repairEstimate: Number(data.repairEstimate || 0),
    repairInvoiceNumber: data.repairInvoiceNumber || '',
    repairInvoiceAmount: Number(data.repairInvoiceAmount || data.repairEstimate || 0),
    repairInvoiceFile: data.repairInvoiceFile || null,
    insuranceCarrier: data.insuranceCarrier || 'Travelers Commercial Auto',
    claimNumber: data.claimNumber || '',
    linkedPolicyId: data.linkedPolicyId || 'POL-TRV-101',
    deductibleTerms: data.deductibleTerms || '$500 Driver Deductible',
    deductibleAmount: Number(data.deductibleAmount !== undefined ? data.deductibleAmount : 500),
    driverLiabilityStatus: data.driverLiabilityStatus || 'Under Review',
    driverChargeStatus: data.driverChargeStatus || 'Pending Assessment',
    driverInvoiceNumber: data.driverInvoiceNumber || '',
    driverPaymentStatus: data.driverPaymentStatus || 'Pending',
    assignedShop: data.assignedShop || 'Speedy Pro Auto Clinic',
    notes: data.notes || ''
  };

  const [newId] = await db('accidents').insert({
    vehicle_id: vId,
    driver_id: dId || null,
    rental_id: rentalId,
    accident_date: data.incidentDate ? `${data.incidentDate} 12:00:00` : db.fn.now(),
    location: data.location || 'Fleet Area',
    description: data.damage || data.damageDescription || '',
    police_report_no: data.policeReportNumber || '',
    estimated_damage: Number(data.repairEstimate || 0),
    status: statusMap[data.status] || 'reported',
    details: JSON.stringify(details),
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });

  return getAccidentById(newId);
}

/**
 * Update an accident
 */
async function updateAccident(id, updates) {
  const numId = typeof id === 'string' && id.startsWith('ACC-')
    ? parseInt(id.replace('ACC-', ''), 10)
    : parseInt(id, 10);

  const existing = await db('accidents').where({ id: numId }).first();
  if (!existing) {
    const err = new Error(`Accident #${id} not found`);
    err.status = 404;
    throw err;
  }

  const patch = { updated_at: db.fn.now() };
  if (updates.location) patch.location = updates.location;
  if (updates.damage || updates.damageDescription) patch.description = updates.damage || updates.damageDescription;
  if (updates.policeReportNumber) patch.police_report_no = updates.policeReportNumber;
  if (updates.repairEstimate !== undefined) patch.estimated_damage = Number(updates.repairEstimate);

  const statusMap = {
    Reported: 'reported',
    'Under Investigation': 'under_investigation',
    'Repair Pending': 'repair_pending',
    Resolved: 'resolved'
  };
  if (updates.status && statusMap[updates.status]) {
    patch.status = statusMap[updates.status];
  }

  let existingDetails = {};
  try {
    existingDetails = JSON.parse(existing.details || '{}');
  } catch (e) {}

  const mergedDetails = { ...existingDetails, ...updates };
  patch.details = JSON.stringify(mergedDetails);

  await db('accidents').where({ id: numId }).update(patch);
  return getAccidentById(numId);
}

/**
 * Delete an accident
 */
async function deleteAccident(id) {
  const numId = typeof id === 'string' && id.startsWith('ACC-')
    ? parseInt(id.replace('ACC-', ''), 10)
    : parseInt(id, 10);

  const deletedCount = await db('accidents').where({ id: numId }).del();
  if (deletedCount === 0) {
    const err = new Error(`Accident #${id} not found`);
    err.status = 404;
    throw err;
  }
  return { success: true, message: `Accident #${id} deleted` };
}

/**
 * Get inspections KPI stats
 */
async function getInspectionStats() {
  const totalInspections = await db('inspections').count('id as cnt').first();
  const passed = await db('inspections').where({ status: 'Passed' }).count('id as cnt').first();
  const flagged = await db('inspections').where({ status: 'Flagged' }).count('id as cnt').first();
  const accidents = await db('accidents').count('id as cnt').first();
  const unresolvedAccidents = await db('accidents').whereNot({ status: 'resolved' }).count('id as cnt').first();

  return {
    totalInspections: Number(totalInspections?.cnt || 0),
    passedCount: Number(passed?.cnt || 0),
    flaggedCount: Number(flagged?.cnt || 0),
    totalAccidents: Number(accidents?.cnt || 0),
    unresolvedAccidents: Number(unresolvedAccidents?.cnt || 0)
  };
}

module.exports = {
  getAllInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection,
  getAllAccidents,
  getAccidentById,
  createAccident,
  updateAccident,
  deleteAccident,
  getInspectionStats
};
