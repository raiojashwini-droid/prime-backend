const prisma = require('../../config/prisma');

const CAR_IMAGES = {
  Toyota: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&auto=format&fit=crop&q=80',
  Honda: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&auto=format&fit=crop&q=80',
  Hyundai: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop&q=80',
  Chevrolet: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&auto=format&fit=crop&q=80',
  Tesla: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&auto=format&fit=crop&q=80',
  Ford: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&auto=format&fit=crop&q=80',
  BMW: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&auto=format&fit=crop&q=80'
};

function formatVehicle(v) {
  const activeRental = v.rentals && v.rentals[0];
  const driverName = activeRental?.drivers
    ? `${activeRental.drivers.first_name} ${activeRental.drivers.last_name}`
    : 'Unassigned';

  const statusMap = {
    available: 'Available',
    reserved: 'Reserved',
    rented: 'Rented',
    maintenance: 'Maintenance',
    unavailable: 'Unavailable',
    sold_retired: 'Sold/Retired'
  };

  const idNum = Number(v.id);
  const formattedId = `VEH-${String(idNum).padStart(3, '0')}`;

  let vehicleType = 'Sedan';
  if (['Tahoe'].includes(v.model)) vehicleType = 'SUV';
  else if (['F-150'].includes(v.model)) vehicleType = 'Truck';
  else if (['Model 3'].includes(v.model)) vehicleType = 'Electric';
  else if (['5 Series'].includes(v.model)) vehicleType = 'Luxury';

  return {
    id: formattedId,
    dbId: idNum,
    name: `${v.make} ${v.model}`,
    plate: v.plate,
    make: v.make,
    model: v.model,
    year: v.year,
    type: vehicleType,
    fuel: v.make === 'Tesla' ? 'Electric' : 'Gasoline',
    transmission: 'Automatic',
    status: statusMap[v.status] || 'Available',
    driver: driverName,
    color: v.color || 'Black',
    mileage: `${v.mileage.toLocaleString()} mi`,
    rawMileage: v.mileage,
    vin: v.vin,
    purchasePrice: Number(v.purchase_price) || 28500,
    insuranceExpiry: '2026-11-15',
    registrationExpiry: '2026-10-30',
    image: CAR_IMAGES[v.make] || CAR_IMAGES.Toyota,
    dailyRate: activeRental ? Math.round(Number(activeRental.weekly_rate) / 7) : 65
  };
}

async function getAllVehicles() {
  const list = await prisma.vehicles.findMany({
    where: { archived_at: null },
    include: {
      rentals: {
        where: { status: 'active' },
        include: {
          drivers: true
        }
      }
    },
    orderBy: { id: 'asc' }
  });

  return list.map(formatVehicle);
}

async function getVehicleById(id) {
  let searchCondition = {};
  if (String(id).startsWith('VEH-')) {
    const rawId = parseInt(String(id).replace('VEH-', ''), 10);
    searchCondition = { id: BigInt(rawId) };
  } else if (!isNaN(Number(id))) {
    searchCondition = { id: BigInt(id) };
  } else {
    searchCondition = { plate: String(id) };
  }

  const v = await prisma.vehicles.findFirst({
    where: searchCondition,
    include: {
      rentals: {
        where: { status: 'active' },
        include: {
          drivers: true
        }
      }
    }
  });

  if (!v) {
    const err = new Error(`Vehicle not found`);
    err.status = 404;
    throw err;
  }

  return formatVehicle(v);
}

async function createVehicle(data) {
  const statusMap = {
    Available: 'available',
    Reserved: 'reserved',
    Rented: 'rented',
    Maintenance: 'maintenance',
    Unavailable: 'unavailable',
    'Sold/Retired': 'sold_retired'
  };

  const mileageNum = parseInt(String(data.mileage || '0').replace(/[^0-9]/g, ''), 10) || 0;
  const cleanVin = (data.vin || `1PRIME${Date.now()}`).trim().toUpperCase();
  const cleanPlate = (data.plate || `PR-${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();

  // If a vehicle with the exact VIN or Plate was previously archived, restore/update it
  const existingArchived = await prisma.vehicles.findFirst({
    where: {
      OR: [{ vin: cleanVin }, { plate: cleanPlate }]
    }
  });

  if (existingArchived) {
    const updated = await prisma.vehicles.update({
      where: { id: existingArchived.id },
      data: {
        vin: cleanVin,
        plate: cleanPlate,
        make: data.make || existingArchived.make,
        model: data.model || existingArchived.model,
        year: parseInt(data.year, 10) || existingArchived.year,
        color: data.color || existingArchived.color || 'White',
        mileage: mileageNum || existingArchived.mileage,
        status: statusMap[data.status] || 'available',
        purchase_date: data.purchaseDate ? new Date(data.purchaseDate) : (existingArchived.purchase_date || new Date()),
        purchase_price: data.purchasePrice ? parseFloat(data.purchasePrice) : (existingArchived.purchase_price || 28000.00),
        location: data.location || data.depotLocation || existingArchived.location || 'Main Yard Hub',
        financing_details: data.financingDetails || data.financingType || existingArchived.financing_details || 'PrimeRoute Fleet',
        archived_at: null
      }
    });
    return getVehicleById(Number(updated.id));
  }

  const created = await prisma.vehicles.create({
    data: {
      vin: cleanVin,
      plate: cleanPlate,
      make: data.make || 'Toyota',
      model: data.model || 'Camry',
      year: parseInt(data.year, 10) || 2024,
      color: data.color || 'White',
      mileage: mileageNum,
      status: statusMap[data.status] || 'available',
      purchase_date: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
      purchase_price: data.purchasePrice ? parseFloat(data.purchasePrice) : 28000.00,
      location: data.location || data.depotLocation || 'Main Yard Hub',
      financing_details: data.financingDetails || data.financingType || 'PrimeRoute Fleet'
    }
  });

  return getVehicleById(Number(created.id));
}

async function updateVehicle(id, updates) {
  let searchCondition = null;
  if (String(id).startsWith('VEH-')) {
    const rawId = parseInt(String(id).replace('VEH-', ''), 10);
    searchCondition = { id: BigInt(rawId) };
  } else if (!isNaN(Number(id))) {
    searchCondition = { id: BigInt(id) };
  } else {
    searchCondition = {
      OR: [
        { plate: String(id) },
        { vin: String(id) }
      ]
    };
  }

  const existing = await prisma.vehicles.findFirst({
    where: searchCondition
  });

  if (!existing) {
    const err = new Error(`Vehicle not found`);
    err.status = 404;
    throw err;
  }

  const statusMap = {
    Available: 'available',
    Reserved: 'reserved',
    Rented: 'rented',
    Maintenance: 'maintenance',
    Unavailable: 'unavailable',
    'Sold/Retired': 'sold_retired'
  };

  const dataToUpdate = {};
  if (updates.status) {
    dataToUpdate.status = statusMap[updates.status] || updates.status.toLowerCase();
  }
  if (updates.mileage !== undefined) {
    dataToUpdate.mileage = parseInt(String(updates.mileage).replace(/[^0-9]/g, ''), 10);
  }
  if (updates.plate) dataToUpdate.plate = updates.plate;
  if (updates.color) dataToUpdate.color = updates.color;
  if (updates.location) dataToUpdate.location = updates.location;

  await prisma.vehicles.update({
    where: { id: existing.id },
    data: dataToUpdate
  });

  return getVehicleById(Number(existing.id));
}

async function deleteVehicle(id) {
  let searchCondition = null;
  if (String(id).startsWith('VEH-')) {
    const rawId = parseInt(String(id).replace('VEH-', ''), 10);
    searchCondition = { id: BigInt(rawId) };
  } else if (!isNaN(Number(id))) {
    searchCondition = { id: BigInt(id) };
  } else {
    searchCondition = {
      OR: [
        { plate: String(id) },
        { vin: String(id) }
      ]
    };
  }

  const existing = await prisma.vehicles.findFirst({
    where: searchCondition
  });

  if (existing) {
    try {
      // Clean up child relations first so MySQL foreign key constraints are satisfied
      await prisma.rentals.deleteMany({ where: { vehicle_id: existing.id } });
      await prisma.documents.deleteMany({ where: { vehicle_id: existing.id } });
      await prisma.maintenance_records.deleteMany({ where: { vehicle_id: existing.id } });
      await prisma.tolls_tickets.deleteMany({ where: { vehicle_id: existing.id } });
      await prisma.insurance_claims.deleteMany({ where: { vehicle_id: existing.id } });
      await prisma.insurance_policies.deleteMany({ where: { vehicle_id: existing.id } });
      await prisma.inspections.deleteMany({ where: { vehicle_id: existing.id } });
      await prisma.expenses.deleteMany({ where: { vehicle_id: existing.id } });
      await prisma.accidents.deleteMany({ where: { vehicle_id: existing.id } });

      // Permanently delete row from MySQL vehicles table
      await prisma.vehicles.delete({
        where: { id: existing.id }
      });
      return { success: true, message: 'Vehicle permanently removed from database' };
    } catch (delErr) {
      console.warn('Cascade delete encountered constraint, forcing direct delete:', delErr?.message);
      try {
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
        await prisma.$executeRawUnsafe(`DELETE FROM vehicles WHERE id = ${existing.id}`);
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
        return { success: true, message: 'Vehicle permanently removed from database' };
      } catch (rawErr) {
        console.error('Raw deleteVehicle error:', rawErr);
        throw rawErr;
      }
    }
  }

  return { success: true, message: 'Vehicle already removed or not found' };
}

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
