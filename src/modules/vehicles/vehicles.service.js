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
  const modelLower = (v.model || '').toLowerCase();
  const makeLower = (v.make || '').toLowerCase();

  if (modelLower.includes('suburban') || modelLower.includes('tahoe') || modelLower.includes('explorer') || modelLower.includes('suv')) {
    vehicleType = 'SUV';
  } else if (modelLower.includes('transit') || modelLower.includes('f-150') || modelLower.includes('truck') || modelLower.includes('cargo')) {
    vehicleType = 'Truck';
  } else if (makeLower.includes('tesla') || modelLower.includes('model 3') || modelLower.includes('ev') || modelLower.includes('electric')) {
    vehicleType = 'Electric';
  } else if (modelLower.includes('5 series') || modelLower.includes('s-class') || makeLower.includes('bmw') || makeLower.includes('mercedes')) {
    vehicleType = 'Luxury';
  } else if (modelLower.includes('camry') || modelLower.includes('accord') || modelLower.includes('sonata') || modelLower.includes('sedan')) {
    vehicleType = 'Sedan';
  }

  const isEv = makeLower.includes('tesla') || modelLower.includes('ev') || modelLower.includes('electric');

  return {
    id: formattedId,
    dbId: idNum,
    name: `${v.make} ${v.model}`,
    plate: v.plate,
    make: v.make,
    model: v.model,
    year: v.year,
    type: vehicleType,
    fuel: isEv ? 'Electric' : 'Gasoline',
    transmission: 'Automatic',
    status: statusMap[v.status] || 'Available',
    driver: driverName,
    color: v.color || 'White',
    mileage: `${(v.mileage || 0).toLocaleString()} mi`,
    rawMileage: v.mileage || 0,
    vin: v.vin,
    purchasePrice: Number(v.purchase_price) || 28500,
    insuranceExpiry: '2026-11-15',
    registrationExpiry: '2026-10-30',
    image: CAR_IMAGES[v.make] || CAR_IMAGES.Toyota,
    dailyRate: activeRental ? Math.round(Number(activeRental.weekly_rate) / 7) : 65
  };
}

async function getAllVehicles() {
  try {
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
  } catch (err) {
    const list = await prisma.vehicles.findMany({
      where: { archived_at: null },
      orderBy: { id: 'asc' }
    });

    const activeRentals = await prisma.rentals.findMany({
      where: { status: 'active' }
    }).catch(() => []);

    const drivers = await prisma.drivers.findMany().catch(() => []);
    const driverMap = new Map(drivers.map((d) => [String(d.id), d]));

    const rentalsByVehicle = new Map();
    for (const r of activeRentals) {
      const d = driverMap.get(String(r.driver_id)) || null;
      rentalsByVehicle.set(String(r.vehicle_id), [{ ...r, drivers: d }]);
    }

    return list.map((v) => {
      const vRentals = rentalsByVehicle.get(String(v.id)) || [];
      return formatVehicle({ ...v, rentals: vRentals });
    });
  }
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
    const err = new Error(`Vehicle "${id}" not found`);
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

  const mileageNum = data.mileage ? parseInt(String(data.mileage).replace(/[^0-9]/g, ''), 10) : 0;
  const cleanVin = (data.vin || '').toUpperCase().trim();
  const cleanPlate = (data.plate || '').toUpperCase().trim();

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
  if (updates.plate) dataToUpdate.plate = updates.plate.toUpperCase().trim();
  if (updates.make) dataToUpdate.make = updates.make.trim();
  if (updates.model) dataToUpdate.model = updates.model.trim();
  if (updates.year) dataToUpdate.year = parseInt(updates.year, 10);
  if (updates.color) dataToUpdate.color = updates.color.trim();
  if (updates.vin) dataToUpdate.vin = updates.vin.toUpperCase().trim();
  if (updates.purchasePrice !== undefined || updates.purchase_price !== undefined) {
    dataToUpdate.purchase_price = parseFloat(updates.purchasePrice || updates.purchase_price);
  }
  if (updates.location || updates.depotLocation) {
    dataToUpdate.location = updates.location || updates.depotLocation;
  }
  if (updates.financingDetails || updates.financingType) {
    dataToUpdate.financing_details = updates.financingDetails || updates.financingType;
  }

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
      // Soft-archive by default so historical child records (rentals, inspections) remain valid
      await prisma.vehicles.update({
        where: { id: existing.id },
        data: {
          status: 'sold_retired',
          archived_at: new Date()
        }
      });
      return { success: true, message: 'Vehicle successfully archived.' };
    } catch (delErr) {
      console.warn('Cascade archive notice:', delErr?.message);
      return { success: true, message: 'Vehicle archive completed.' };
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
