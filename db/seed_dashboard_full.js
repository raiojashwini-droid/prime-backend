const prisma = require('../src/config/prisma');

async function seedFullFleet() {
  console.log('--- SEEDING FULL FLEET DATA (65 Vehicles, 48 Drivers, Rentals, Expenses, Alerts) ---');

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

  // 1. Seed 48 Drivers (Total outstanding balance: $3,850)
  const driverDefs = [
    { first: 'Marcus', last: 'Vance', email: 'marcus.vance@primeroute.io', phone: '+1 (555) 234-8901', lic: 'DL-NY-9028148', state: 'NY', balance: 350.00, deposit: 500.00 },
    { first: 'David', last: 'Miller', email: 'david.miller@gmail.com', phone: '+1 (555) 345-6712', lic: 'DL-CA-4491029', state: 'CA', balance: 0.00, deposit: 600.00 },
    { first: 'Sarah', last: 'Jenkins', email: 'sjenkins@outlook.com', phone: '+1 (555) 456-7890', lic: 'DL-IL-8849103', state: 'IL', balance: 0.00, deposit: 500.00 },
    { first: 'Alexander', last: 'Reed', email: 'alex.reed@ridesharefleet.com', phone: '+1 (555) 567-8901', lic: 'DL-TX-5510928', state: 'TX', balance: 1100.00, deposit: 500.00 },
    { first: 'Elena', last: 'Rostova', email: 'elena.rostova@vipchauffeur.org', phone: '+1 (555) 678-9012', lic: 'DL-FL-7729104', state: 'FL', balance: 0.00, deposit: 1000.00 },
    { first: 'Carlos', last: 'Mendez', email: 'cmendez88@gmail.com', phone: '+1 (555) 789-0123', lic: 'DL-WA-3391028', state: 'WA', balance: 450.00, deposit: 500.00 },
    { first: 'Liam', last: 'Smith', email: 'lsmith@primeroute.io', phone: '+1 (555) 890-1234', lic: 'DL-MA-1029384', state: 'MA', balance: 500.00, deposit: 500.00 },
    { first: 'Noah', last: 'Johnson', email: 'njohnson@primefleet.com', phone: '+1 (555) 901-2345', lic: 'DL-OH-9283741', state: 'OH', balance: 400.00, deposit: 500.00 },
    { first: 'Oliver', last: 'Williams', email: 'owilliams@primeroute.io', phone: '+1 (555) 012-3456', lic: 'DL-PA-8374619', state: 'PA', balance: 1050.00, deposit: 500.00 }
  ];

  // Fill up to 48 drivers
  const allDrivers = [];
  for (let i = 1; i <= 48; i++) {
    const preset = driverDefs[i - 1];
    allDrivers.push({
      id: BigInt(i),
      first_name: preset ? preset.first : `DriverFirst${i}`,
      last_name: preset ? preset.last : `DriverLast${i}`,
      email: preset ? preset.email : `driver${i}@primeroute.io`,
      phone: preset ? preset.phone : `+1 (555) 000-${String(1000 + i).slice(-4)}`,
      license_number: preset ? preset.lic : `DL-US-${100000 + i}`,
      license_state: preset ? preset.state : 'NY',
      license_expiry: new Date('2026-12-31'),
      status: 'active',
      balance: preset ? preset.balance : 0.00,
      deposit_held: preset ? preset.deposit : 500.00,
      notes: 'Active commercial driver'
    });
  }

  for (const d of allDrivers) {
    await prisma.drivers.create({ data: d });
  }
  console.log(`Created ${allDrivers.length} Drivers.`);

  // 2. Seed 65 Vehicles
  // Distribution:
  // 42 Rented
  // 12 Available
  // 4 Reserved
  // 4 Maintenance
  // 2 Unavailable
  // 1 Sold/Retired
  const vehicleMakes = [
    { make: 'Toyota', model: 'Camry', year: 2023, color: 'Midnight Black', rate: 285.00 },
    { make: 'Honda', model: 'Accord', year: 2023, color: 'Platinum White', rate: 290.00 },
    { make: 'Hyundai', model: 'Sonata', year: 2022, color: 'Electric Shadow', rate: 275.00 },
    { make: 'Chevrolet', model: 'Malibu', year: 2023, color: 'Dark Ash Metallic', rate: 260.00 },
    { make: 'Tesla', model: 'Model 3', year: 2024, color: 'Deep Blue Metallic', rate: 390.00 },
    { make: 'Chevrolet', model: 'Tahoe', year: 2023, color: 'Summit White', rate: 450.00 },
    { make: 'Ford', model: 'F-150', year: 2023, color: 'Carbonized Gray', rate: 340.00 },
    { make: 'BMW', model: '5 Series', year: 2024, color: 'Phytonic Blue', rate: 520.00 }
  ];

  const allVehicles = [];
  for (let i = 1; i <= 65; i++) {
    let status = 'available';
    if (i <= 42) status = 'rented';
    else if (i <= 54) status = 'available';
    else if (i <= 58) status = 'reserved';
    else if (i <= 62) status = 'maintenance';
    else if (i <= 64) status = 'unavailable';
    else status = 'sold_retired';

    const vm = vehicleMakes[(i - 1) % vehicleMakes.length];
    allVehicles.push({
      id: BigInt(i),
      vin: `1PRIME${String(i).padStart(4, '0')}XYZ${100000 + i}`,
      plate: `PR-2024-${String(100 + i)}`,
      make: vm.make,
      model: vm.model,
      year: vm.year,
      color: vm.color,
      mileage: 15000 + (i * 450),
      status,
      purchase_date: new Date('2023-01-15'),
      purchase_price: 28000.00,
      financing_details: 'PrimeRoute Commercial Fleet Credit',
      location: i % 2 === 0 ? 'Main Yard Hub' : 'Airport Cargo Terminal'
    });
  }

  for (const v of allVehicles) {
    await prisma.vehicles.create({ data: v });
  }
  console.log(`Created ${allVehicles.length} Vehicles.`);

  // 3. Seed 42 Active Rentals (totaling monthly revenue $48,750 ≈ weekly $11,360)
  // 48750 / 42 ≈ 1160.71 / month ≈ 270.83 / week
  const allRentals = [];
  for (let i = 1; i <= 42; i++) {
    allRentals.push({
      id: BigInt(i),
      contract_no: `RNT-2024-${String(100 + i)}`,
      vehicle_id: BigInt(i), // vehicle 1 to 42
      driver_id: BigInt(i),  // driver 1 to 42
      created_by: BigInt(1), // Marcus Brody
      status: 'active',
      start_date: new Date('2025-07-01'),
      end_date: new Date('2025-07-31'),
      weekly_rate: 270.83, // 4.3 weeks * 270.83 * 42 = $48,750
      deposit_amount: 500.00,
      mileage_at_pickup: 15000 + (i * 450),
      terms: 'PrimeRoute Fleet Standard Commercial Rental Agreement'
    });
  }

  for (const r of allRentals) {
    await prisma.rentals.create({ data: r });
  }
  console.log(`Created ${allRentals.length} Rentals.`);

  // 4. Seed Monthly Expenses totaling $18,420
  // Categories matching PrimeRoute
  const expenseBreakdown = [
    { cat: 'oil_change', desc: 'Preventative 5,000-mile synthetic oil service', amount: 3200.00 },
    { cat: 'insurance', desc: 'Commercial auto liability fleet insurance policy', amount: 5600.00 },
    { cat: 'repairs', desc: 'Brake pads, fluid flushes, alignment adjustments', amount: 3820.00 },
    { cat: 'tires', desc: 'Michelin Defender all-season tire sets', amount: 2400.00 },
    { cat: 'tolls', desc: 'Automated fleet transponder municipal toll charges', amount: 1650.00 },
    { cat: 'cleaning', desc: 'Detailing, interior sanitization & wash services', amount: 950.00 },
    { cat: 'software', desc: 'Telematics, tracking GPS, management platform fees', amount: 800.00 }
  ]; // Total: 3200 + 5600 + 3820 + 2400 + 1650 + 950 + 800 = $18,420!

  let expId = 1;
  for (const eb of expenseBreakdown) {
    await prisma.expenses.create({
      data: {
        id: BigInt(expId++),
        category: eb.cat,
        amount: eb.amount,
        expense_date: new Date('2025-07-15'),
        description: eb.desc,
        status: 'paid'
      }
    });
  }
  console.log(`Created ${expenseBreakdown.length} Expenses totaling $18,420.`);

  // 5. Seed the 7 Important Alerts visible on the Dashboard
  const alerts = [
    {
      rule_id: BigInt(1),
      event_type: 'contract_expiry',
      title: '3 Lease Contracts Expire in 7 Days',
      severity: 'warning',
      message: '3 commercial leases are approaching completion window within the next 7 business days.',
      related_entity_type: 'rentals',
      related_entity_id: BigInt(1)
    },
    {
      rule_id: BigInt(2),
      event_type: 'maintenance_due',
      title: '2 Vehicles Due for 5,000 mi Oil Service',
      severity: 'warning',
      message: 'Vehicles PR-2024-101 and PR-2024-106 have crossed preventative maintenance mileage thresholds.',
      related_entity_type: 'vehicles',
      related_entity_id: BigInt(1)
    },
    {
      rule_id: BigInt(3),
      event_type: 'unpaid_citation',
      title: 'Unpaid Toll / Violation NYC-PARK-8819',
      severity: 'danger',
      message: 'Municipal parking citation $75 due on vehicle PR-2024-104 pending driver attribution.',
      related_entity_type: 'tolls_tickets',
      related_entity_id: BigInt(1)
    },
    {
      rule_id: BigInt(4),
      event_type: 'document_expiry',
      title: '4 Compliance Documents Expiring (Reg / Insurance)',
      severity: 'warning',
      message: 'Commercial registrations and policy certificates expiring within 30 days.',
      related_entity_type: 'documents',
      related_entity_id: BigInt(1)
    },
    {
      rule_id: BigInt(5),
      event_type: 'outstanding_balance',
      title: '1 Driver with Outstanding Balance ($350)',
      severity: 'info',
      message: 'Driver Marcus Vance has an unpaid weekly balance of $350 past grace period.',
      related_entity_type: 'drivers',
      related_entity_id: BigInt(1)
    },
    {
      rule_id: BigInt(6),
      event_type: 'accident_claim',
      title: '1 Unresolved Accident Claim Under Review',
      severity: 'warning',
      message: 'Incident claim #CLM-2024-004 is currently under commercial carrier review.',
      related_entity_type: 'accidents',
      related_entity_id: BigInt(1)
    },
    {
      rule_id: BigInt(7),
      event_type: 'inspection_due',
      title: '2 Vehicles Awaiting Handover Inspection',
      severity: 'info',
      message: 'Vehicles returned to main dispatch yard awaiting 360-degree digital check-in inspection.',
      related_entity_type: 'inspections',
      related_entity_id: BigInt(1)
    }
  ];

  let alertId = 1;
  for (const a of alerts) {
    await prisma.alert_history.create({
      data: {
        id: BigInt(alertId++),
        ...a
      }
    });
  }
  console.log(`Created ${alerts.length} System Alerts.`);

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

seedFullFleet()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
