const prisma = require('../src/config/prisma');

async function seedSingleRecord() {
  console.log('--- RESETTING DATABASE TO EXACTLY 1 TEST RECORD PER ENTITY ---');

  // Clear existing domain data safely
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  await prisma.inspection_photos.deleteMany();
  await prisma.inspections.deleteMany();
  await prisma.accidents.deleteMany();
  await prisma.rental_signatures.deleteMany();
  await prisma.rental_amendments.deleteMany();
  await prisma.rentals.deleteMany();
  await prisma.vehicle_assignments.deleteMany();
  await prisma.expenses.deleteMany();
  await prisma.maintenance_records.deleteMany();
  await prisma.tolls_tickets.deleteMany();
  await prisma.alert_history.deleteMany();
  await prisma.drivers.deleteMany();
  await prisma.vehicles.deleteMany();
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

  // 1. Exactly 1 Driver
  await prisma.drivers.create({
    data: {
      id: BigInt(1),
      first_name: 'Marcus',
      last_name: 'Vance',
      email: 'marcus.vance@primeroute.io',
      phone: '+1 (555) 234-8901',
      license_number: 'DL-NY-9028148',
      license_state: 'NY',
      license_expiry: new Date('2026-12-31'),
      status: 'active',
      balance: 350.00,
      deposit_held: 500.00,
      notes: 'Test Driver #1'
    }
  });
  console.log('Created 1 Driver: Marcus Vance');

  // 2. Exactly 1 Vehicle (Status: Rented)
  await prisma.vehicles.create({
    data: {
      id: BigInt(1),
      vin: '4T1B11HK5JU192831',
      plate: 'PR-2024-TC',
      make: 'Toyota',
      model: 'Camry SE',
      year: 2024,
      color: 'Midnight Black',
      mileage: 24500,
      status: 'rented',
      purchase_date: new Date('2024-01-15'),
      purchase_price: 28500.00,
      financing_details: 'PrimeRoute Fleet',
      location: 'Main Yard Hub'
    }
  });
  console.log('Created 1 Vehicle: Toyota Camry SE (PR-2024-TC)');

  // 3. Exactly 1 Active Rental ($350/week = $1,500/month)
  await prisma.rentals.create({
    data: {
      id: BigInt(1),
      contract_no: 'RNT-2024-001',
      vehicle_id: BigInt(1),
      driver_id: BigInt(1),
      created_by: BigInt(1),
      status: 'active',
      start_date: new Date('2025-07-01'),
      end_date: new Date('2025-07-31'),
      weekly_rate: 350.00,
      deposit_amount: 500.00,
      mileage_at_pickup: 24500,
      terms: 'Standard commercial rental agreement'
    }
  });
  console.log('Created 1 Active Rental: RNT-2024-001 ($350/wk)');

  // 4. Exactly 1 Expense ($120 Oil Change)
  await prisma.expenses.create({
    data: {
      id: BigInt(1),
      category: 'oil_change',
      amount: 120.00,
      expense_date: new Date('2025-07-10'),
      description: 'Synthetic oil & filter service',
      status: 'paid'
    }
  });
  console.log('Created 1 Expense: $120.00');

  // 5. Exactly 1 Alert
  await prisma.alert_history.create({
    data: {
      id: BigInt(1),
      event_type: 'contract_expiry',
      title: '1 Lease Contract Expires in 7 Days',
      severity: 'warning',
      message: 'Rental contract RNT-2024-001 expiring soon.',
      related_entity_type: 'rentals',
      related_entity_id: BigInt(1)
    }
  });
  console.log('Created 1 System Alert');

  console.log('--- DATABASE SUCCESSFULLY RESET TO 1 SINGLE TEST RECORD ---');
}

seedSingleRecord()
  .catch((e) => {
    console.error('Reset error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
