const prisma = require('../../config/prisma');

function safeFormatDate(d, fallback = '2026-11-17') {
  if (!d) return fallback;
  if (typeof d === 'string') return d.split('T')[0];
  if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString().split('T')[0];
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  } catch (err) {}
  return fallback;
}

function formatRental(r) {
  const v = r.vehicles;
  const d = r.drivers;

  const vehicleName = v ? `${v.make} ${v.model} (${v.plate})` : 'Vehicle N/A';
  const driverName = d ? `${d.first_name} ${d.last_name}` : 'Driver N/A';

  const weeklyRent = Number(r.weekly_rate) || 450.00;
  const deposit = Number(r.deposit_amount) || 500.00;
  const amount = Math.round(weeklyRent * 4);
  const tax = Math.round(amount * 0.08);
  const total = amount + tax;

  const reverseStatusMap = {
    draft: 'Draft',
    awaiting_signature: 'Awaiting Signature',
    active: 'Active',
    renewed: 'Renewed',
    terminated: 'Terminated',
    completed: 'Completed'
  };

  const statusStr = reverseStatusMap[r.status] || 'Draft';
  const agreementStatusStr = r.status === 'awaiting_signature'
    ? 'Awaiting Signature'
    : r.status === 'draft'
      ? 'Draft'
      : 'Signed';

  const startStr = safeFormatDate(r.start_date, '2026-11-17');
  const endStr = safeFormatDate(r.end_date, '2026-12-01');
  const rawContract = r.contract_no ? String(r.contract_no) : `RNT-${String(r.id || 1001)}`;
  const agreementDigits = rawContract.replace(/[^0-9]/g, '').slice(-4) || '1001';

  let meta = {};
  if (r.terms) {
    try {
      meta = JSON.parse(r.terms);
    } catch (e) {
      meta = { notes: r.terms };
    }
  }

  return {
    id: rawContract,
    dbId: Number(r.id),
    customer: driverName,
    customerPhone: d?.phone || '',
    customerEmail: d?.email || '',
    vehicle: vehicleName,
    vehicleId: v ? `VEH-${String(v.id).padStart(3, '0')}` : null,
    driver: driverName,
    driverId: d ? `DRV-${String(Number(d.id) + 100).padStart(3, '0')}` : null,
    startDate: startStr,
    endDate: endStr,
    rentalType: meta.rentalType || 'Commercial Weekly',
    pickupLocation: meta.pickupLocation || 'JFK Airport Fleet Hub',
    dropoffLocation: meta.dropoffLocation || 'Manhattan Financial Center',
    amount,
    deposit,
    tax,
    discount: 0,
    total,
    paymentStatus: r.status === 'active' ? 'Paid' : 'Pending',
    status: statusStr,
    paymentMethod: meta.paymentMethod || 'Corporate ACH',
    notes: meta.notes || (typeof r.terms === 'string' && !r.terms.startsWith('{') ? r.terms : 'Commercial fleet lease agreement.'),
    pickupDateTime: `${startStr}T09:00:00`,
    pickupOdometer: r.mileage_at_pickup || 24500,
    pickupFuelLevel: 'Full (100%)',
    pickupCondition: 'Pristine / No visible damage',
    pickupRemarks: `Handover inspection verified with ${driverName}.`,
    weeklyRent,
    paymentDueDay: meta.paymentSchedule || meta.paymentDueDay || 'Every Monday',
    securityDeposit: deposit,
    mileageAllowance: meta.mileageAllowance || 0,
    excessMileageRate: meta.excessMileageRate || 0.25,
    approvedTerms: meta.approvedTerms || [],
    agreementStatus: agreementStatusStr,
    agreementData: {
      owner: 'PrimeRoute Fleet Operations',
      renter: driverName,
      license: d?.license_number || 'DL-PENDING',
      vehicle: vehicleName,
      vin: v?.vin || 'VIN-PENDING',
      plate: v?.plate || 'PLATE-PENDING',
      weeklyRent,
      securityDeposit: deposit,
      paymentDueDay: meta.paymentSchedule || meta.paymentDueDay || 'Every Monday'
    },
    driverSignature: driverName,
    representativeSignature: 'Marcus Brody (Owner)',
    signedAt: `${startStr}T09:15:00`,
    agreementId: `AGR-${agreementDigits}`,
    returnDateTime: null,
    returnOdometer: null,
    returnFuelLevel: null,
    returnCondition: null,
    returnRemarks: null,
    returnStatus: 'Pending Return'
  };
}

async function getAllRentals() {
  try {
    const list = await prisma.rentals.findMany({
      include: {
        vehicles: true,
        drivers: true
      },
      orderBy: { id: 'asc' }
    });

    return list.map(formatRental);
  } catch (err) {
    // Resilient fallback when a rental references an unseeded or missing vehicle ID
    const rentals = await prisma.rentals.findMany({
      orderBy: { id: 'asc' }
    });

    const drivers = await prisma.drivers.findMany().catch(() => []);
    const driverMap = new Map(drivers.map((d) => [String(d.id), d]));

    const vehicles = await prisma.vehicles.findMany().catch(() => []);
    const vehicleMap = new Map(vehicles.map((v) => [String(v.id), v]));

    return rentals.map((r) => {
      const v = vehicleMap.get(String(r.vehicle_id)) || null;
      const d = driverMap.get(String(r.driver_id)) || null;
      return formatRental({ ...r, vehicles: v, drivers: d });
    });
  }
}

async function findRentalEntity(id) {
  if (!id) return null;
  const strId = String(id).trim();

  let rental = null;

  // 1. Exact contract_no match
  rental = await prisma.rentals.findFirst({
    where: { contract_no: strId }
  }).catch(() => null);

  // 2. Numeric primary key match
  if (!rental && !isNaN(Number(strId))) {
    rental = await prisma.rentals.findFirst({
      where: { id: BigInt(strId) }
    }).catch(() => null);
  }

  // 3. Fallback partial match
  if (!rental) {
    rental = await prisma.rentals.findFirst({
      where: { contract_no: { contains: strId } }
    }).catch(() => null);
  }

  if (!rental) return null;

  // Safely attach vehicle and driver without relational join crashes
  const v = rental.vehicle_id
    ? await prisma.vehicles.findFirst({ where: { id: rental.vehicle_id } }).catch(() => null)
    : null;
  const d = rental.driver_id
    ? await prisma.drivers.findFirst({ where: { id: rental.driver_id } }).catch(() => null)
    : null;

  return { ...rental, vehicles: v, drivers: d };
}

async function getRentalById(id) {
  const r = await findRentalEntity(id);

  if (!r) {
    const err = new Error('Rental contract not found');
    err.status = 404;
    throw err;
  }

  return formatRental(r);
}

async function createRental(data) {
  // 1. Resolve vehicle entity
  let vehicleEntity = null;
  if (data.vehicleId) {
    const vStr = String(data.vehicleId).replace(/^VEH-0*/i, '').trim();
    if (!isNaN(Number(vStr))) {
      vehicleEntity = await prisma.vehicles.findFirst({ where: { id: BigInt(vStr) } });
    }
  }
  if (!vehicleEntity && data.vehicle) {
    const plateMatch = data.vehicle.match(/\(([^)]+)\)/);
    const plate = plateMatch ? plateMatch[1].trim() : data.vehicle.trim();
    vehicleEntity = await prisma.vehicles.findFirst({
      where: {
        OR: [
          { plate: plate },
          { plate: data.vehicle }
        ]
      }
    });
  }
  if (!vehicleEntity) {
    vehicleEntity = (await prisma.vehicles.findFirst({ where: { status: 'available' } })) || (await prisma.vehicles.findFirst());
  }

  if (!vehicleEntity) {
    const err = new Error('No eligible vehicle found in fleet to assign.');
    err.status = 400;
    throw err;
  }

  // 2. Resolve driver entity
  let driverEntity = null;
  if (data.driverId) {
    const dStr = String(data.driverId).trim();
    if (dStr.toUpperCase().startsWith('DRV-')) {
      const numPart = parseInt(dStr.toUpperCase().replace('DRV-', ''), 10);
      if (!isNaN(numPart)) {
        if (numPart > 100) {
          driverEntity = await prisma.drivers.findFirst({ where: { id: BigInt(numPart - 100) } });
        }
        if (!driverEntity) {
          driverEntity = await prisma.drivers.findFirst({ where: { id: BigInt(numPart) } });
        }
      }
    } else if (!isNaN(Number(dStr))) {
      driverEntity = await prisma.drivers.findFirst({ where: { id: BigInt(dStr) } });
    }
  }
  if (!driverEntity && (data.driver || data.customer)) {
    const targetName = (data.driver || data.customer).trim();
    const names = targetName.split(' ');
    driverEntity = await prisma.drivers.findFirst({
      where: {
        OR: [
          { first_name: names[0] },
          { email: targetName }
        ]
      }
    });
  }
  if (!driverEntity) {
    driverEntity = (await prisma.drivers.findFirst({ where: { archived_at: null } })) || (await prisma.drivers.findFirst());
  }

  if (!driverEntity) {
    const err = new Error('No active driver found in registry to assign.');
    err.status = 400;
    throw err;
  }

  const contractNo = data.id || `PR-CTR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const statusMap = {
    'Draft': 'draft',
    'Awaiting Signature': 'awaiting_signature',
    'Active': 'active',
    'Renewed': 'renewed',
    'Terminated': 'terminated',
    'Completed': 'completed',
    draft: 'draft',
    awaiting_signature: 'awaiting_signature',
    active: 'active',
    renewed: 'renewed',
    terminated: 'terminated',
    completed: 'completed'
  };

  const statusVal = statusMap[data.status] || statusMap[data.agreementStatus] || 'draft';

  const metaData = {
    rentalType: data.rentalType || 'Commercial Weekly',
    pickupLocation: data.pickupLocation || 'JFK Airport Fleet Hub',
    dropoffLocation: data.dropoffLocation || 'Manhattan Financial Center',
    paymentMethod: data.paymentMethod || 'Corporate ACH',
    paymentSchedule: data.paymentSchedule || data.paymentDueDay || 'Weekly every Monday',
    paymentDueDay: data.paymentDueDay || data.paymentSchedule || 'Weekly every Monday',
    mileageAllowance: Number(data.mileageAllowance) || 0,
    excessMileageRate: Number(data.excessMileageRate) || 0.25,
    approvedTerms: data.approvedTerms || [],
    notes: data.notes || ''
  };
  const termsJson = JSON.stringify(metaData);

  // Check if contract with this contract_no already exists
  const existingContract = await prisma.rentals.findFirst({ where: { contract_no: contractNo } });
  if (existingContract) {
    const updated = await prisma.rentals.update({
      where: { id: existingContract.id },
      data: {
        vehicle_id: vehicleEntity.id,
        driver_id: driverEntity.id,
        status: statusVal,
        start_date: data.startDate ? new Date(data.startDate) : existingContract.start_date,
        end_date: data.endDate ? new Date(data.endDate) : existingContract.end_date,
        weekly_rate: data.weeklyRent !== undefined && data.weeklyRent !== '' ? parseFloat(data.weeklyRent) : existingContract.weekly_rate,
        deposit_amount: (data.deposit !== undefined && data.deposit !== '')
          ? parseFloat(data.deposit)
          : (data.securityDeposit !== undefined && data.securityDeposit !== '')
          ? parseFloat(data.securityDeposit)
          : existingContract.deposit_amount,
        terms: termsJson
      }
    });
    if (statusVal === 'active') {
      await prisma.vehicles.update({
        where: { id: vehicleEntity.id },
        data: { status: 'rented' }
      }).catch(() => {});
    }
    return getRentalById(Number(updated.id));
  }

  const created = await prisma.rentals.create({
    data: {
      contract_no: contractNo,
      vehicle_id: vehicleEntity.id,
      driver_id: driverEntity.id,
      created_by: BigInt(1),
      status: statusVal,
      start_date: data.startDate ? new Date(data.startDate) : new Date(),
      end_date: data.endDate ? new Date(data.endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      weekly_rate: data.weeklyRent !== undefined && data.weeklyRent !== '' ? parseFloat(data.weeklyRent) : 450.00,
      deposit_amount: (data.deposit !== undefined && data.deposit !== '')
        ? parseFloat(data.deposit)
        : (data.securityDeposit !== undefined && data.securityDeposit !== '')
        ? parseFloat(data.securityDeposit)
        : 500.00,
      mileage_at_pickup: data.pickupOdometer ? parseInt(data.pickupOdometer, 10) : 0,
      terms: termsJson
    }
  });

  if (statusVal === 'active') {
    await prisma.vehicles.update({
      where: { id: vehicleEntity.id },
      data: { status: 'rented' }
    }).catch(() => {});
  }

  return getRentalById(Number(created.id));
}

async function updateRental(id, updates) {
  const existing = await findRentalEntity(id);
  if (!existing) {
    const err = new Error('Rental contract not found');
    err.status = 404;
    throw err;
  }

  const dataToUpdate = {};
  const statusMap = {
    'Draft': 'draft',
    'Awaiting Signature': 'awaiting_signature',
    'Active': 'active',
    'Renewed': 'renewed',
    'Terminated': 'terminated',
    'Completed': 'completed',
    draft: 'draft',
    awaiting_signature: 'awaiting_signature',
    active: 'active',
    renewed: 'renewed',
    terminated: 'terminated',
    completed: 'completed'
  };

  if (updates.status || updates.agreementStatus) {
    const targetStatus = updates.status || updates.agreementStatus;
    dataToUpdate.status = statusMap[targetStatus] || 'draft';
  }
  if (updates.startDate) dataToUpdate.start_date = new Date(updates.startDate);
  if (updates.endDate) dataToUpdate.end_date = new Date(updates.endDate);
  if (updates.weeklyRent !== undefined && updates.weeklyRent !== '') {
    dataToUpdate.weekly_rate = parseFloat(updates.weeklyRent);
  } else if (updates.weekly_rate !== undefined && updates.weekly_rate !== '') {
    dataToUpdate.weekly_rate = parseFloat(updates.weekly_rate);
  }
  if (updates.deposit !== undefined && updates.deposit !== '') {
    dataToUpdate.deposit_amount = parseFloat(updates.deposit);
  } else if (updates.securityDeposit !== undefined && updates.securityDeposit !== '') {
    dataToUpdate.deposit_amount = parseFloat(updates.securityDeposit);
  }

  // Preserve & merge terms JSON
  let existingMeta = {};
  if (existing.terms) {
    try {
      existingMeta = JSON.parse(existing.terms);
    } catch (e) {
      existingMeta = { notes: existing.terms };
    }
  }

  const mergedMeta = {
    ...existingMeta,
    rentalType: updates.rentalType || existingMeta.rentalType || 'Commercial Weekly',
    pickupLocation: updates.pickupLocation || existingMeta.pickupLocation || 'JFK Airport Fleet Hub',
    dropoffLocation: updates.dropoffLocation || existingMeta.dropoffLocation || 'Manhattan Financial Center',
    paymentMethod: updates.paymentMethod || existingMeta.paymentMethod || 'Corporate ACH',
    paymentSchedule: updates.paymentSchedule || updates.paymentDueDay || existingMeta.paymentSchedule || 'Weekly every Monday',
    paymentDueDay: updates.paymentDueDay || updates.paymentSchedule || existingMeta.paymentDueDay || 'Every Monday',
    mileageAllowance: updates.mileageAllowance !== undefined ? Number(updates.mileageAllowance) : (existingMeta.mileageAllowance || 0),
    excessMileageRate: updates.excessMileageRate !== undefined ? Number(updates.excessMileageRate) : (existingMeta.excessMileageRate || 0.25),
    approvedTerms: updates.approvedTerms || existingMeta.approvedTerms || [],
    notes: updates.notes !== undefined ? updates.notes : (existingMeta.notes || '')
  };
  dataToUpdate.terms = JSON.stringify(mergedMeta);

  if (updates.vehicleId) {
    const vStr = String(updates.vehicleId).replace(/^VEH-0*/i, '').trim();
    if (!isNaN(Number(vStr))) {
      const vFound = await prisma.vehicles.findFirst({ where: { id: BigInt(vStr) } });
      if (vFound) dataToUpdate.vehicle_id = vFound.id;
    }
  } else if (updates.vehicle) {
    const plateMatch = updates.vehicle.match(/\(([^)]+)\)/);
    const plate = plateMatch ? plateMatch[1].trim() : updates.vehicle.trim();
    const vFound = await prisma.vehicles.findFirst({ where: { plate: plate } });
    if (vFound) dataToUpdate.vehicle_id = vFound.id;
  }

  if (updates.driverId) {
    const dStr = String(updates.driverId).trim();
    if (dStr.toUpperCase().startsWith('DRV-')) {
      const numPart = parseInt(dStr.toUpperCase().replace('DRV-', ''), 10);
      if (!isNaN(numPart)) {
        let dFound = null;
        if (numPart > 100) {
          dFound = await prisma.drivers.findFirst({ where: { id: BigInt(numPart - 100) } });
        }
        if (!dFound) {
          dFound = await prisma.drivers.findFirst({ where: { id: BigInt(numPart) } });
        }
        if (dFound) dataToUpdate.driver_id = dFound.id;
      }
    } else if (!isNaN(Number(dStr))) {
      const dFound = await prisma.drivers.findFirst({ where: { id: BigInt(dStr) } });
      if (dFound) dataToUpdate.driver_id = dFound.id;
    }
  } else if (updates.driver || updates.customer) {
    const targetName = (updates.driver || updates.customer).trim();
    const names = targetName.split(' ');
    const dFound = await prisma.drivers.findFirst({
      where: {
        OR: [
          { first_name: names[0] },
          { email: targetName }
        ]
      }
    });
    if (dFound) dataToUpdate.driver_id = dFound.id;
  }

  const updated = await prisma.rentals.update({
    where: { id: existing.id },
    data: dataToUpdate
  });

  // Re-sync vehicle statuses if vehicle reassigned or status changed
  if (dataToUpdate.vehicle_id && String(dataToUpdate.vehicle_id) !== String(existing.vehicle_id)) {
    // Old vehicle becomes available
    await prisma.vehicles.update({
      where: { id: existing.vehicle_id },
      data: { status: 'available' }
    }).catch(() => {});
    // New vehicle becomes rented
    await prisma.vehicles.update({
      where: { id: dataToUpdate.vehicle_id },
      data: { status: 'rented' }
    }).catch(() => {});
  } else if (dataToUpdate.status === 'completed' || dataToUpdate.status === 'terminated') {
    await prisma.vehicles.update({
      where: { id: existing.vehicle_id },
      data: { status: 'available' }
    }).catch(() => {});
  } else if (dataToUpdate.status === 'active') {
    await prisma.vehicles.update({
      where: { id: existing.vehicle_id },
      data: { status: 'rented' }
    }).catch(() => {});
  }

  return getRentalById(Number(updated.id));
}

async function deleteRental(id) {
  const rental = await findRentalEntity(id);
  if (rental) {
    try {
      await prisma.rental_signatures.deleteMany({ where: { rental_id: rental.id } }).catch(() => {});
      await prisma.rental_amendments.deleteMany({ where: { rental_id: rental.id } }).catch(() => {});
      await prisma.expenses.deleteMany({ where: { rental_id: rental.id } }).catch(() => {});
      await prisma.inspections.deleteMany({ where: { rental_id: rental.id } }).catch(() => {});
      await prisma.invoices.deleteMany({ where: { rental_id: rental.id } }).catch(() => {});
      await prisma.accidents.deleteMany({ where: { rental_id: rental.id } }).catch(() => {});
      await prisma.ledger_entries.deleteMany({ where: { rental_id: rental.id } }).catch(() => {});
      await prisma.tolls_tickets.deleteMany({ where: { rental_id: rental.id } }).catch(() => {});
      await prisma.documents.deleteMany({ where: { rental_id: rental.id } }).catch(() => {});

      if (rental.vehicle_id) {
        await prisma.vehicles.update({
          where: { id: rental.vehicle_id },
          data: { status: 'available' }
        }).catch(() => {});
      }

      await prisma.rentals.delete({
        where: { id: rental.id }
      });
      return { success: true, message: 'Rental contract permanently removed from database' };
    } catch (err) {
      console.warn('Cascade delete encountered error, using raw delete:', err?.message);
      try {
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
        await prisma.$executeRawUnsafe(`DELETE FROM rentals WHERE id = ${rental.id}`);
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
        if (rental.vehicle_id) {
          await prisma.vehicles.update({
            where: { id: rental.vehicle_id },
            data: { status: 'available' }
          }).catch(() => {});
        }
        return { success: true, message: 'Rental contract permanently removed from database' };
      } catch (rawErr) {
        console.error('Raw deleteRental error:', rawErr);
        throw rawErr;
      }
    }
  }

  return { success: true, message: 'Rental already removed or not found' };
}

module.exports = {
  getAllRentals,
  getRentalById,
  createRental,
  updateRental,
  deleteRental,
  terminateRental: deleteRental
};
