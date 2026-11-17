/**
 * Seed real fleet maintenance records into MySQL maintenance_records table.
 * Links to real vehicles (1..6) and real vendors (2: Jiffy Lube, 4: Bridgestone, etc.)
 */
exports.seed = async function (knex) {
  // Clear existing records if any
  await knex('maintenance_records').del();

  const records = [
    {
      id: 1,
      vehicle_id: 1, // Toyota Camry SE (PR-2024-TC), 24,500 mi
      vendor_id: 2, // Jiffy Lube
      service_date: '2026-11-25',
      odometer: 24500,
      service_type: 'Synthetic Oil & Filter (0W-20)',
      description: 'Scheduled 5,000-mile synthetic oil change, OEM filter replacement, and fluid top-off.',
      cost: 95.00,
      invoice_url: 'invoices/maint_001_toyota_oil.pdf',
      next_service_odometer: 29500,
      next_service_date: '2027-02-25',
      status: 'scheduled'
    },
    {
      id: 2,
      vehicle_id: 2, // Honda Accord Sport (PR-2024-HA), 18,200 mi
      vendor_id: 2, // Jiffy Lube
      service_date: '2026-10-15', // Past date -> Overdue
      odometer: 18200,
      service_type: 'Brake Service & Pad Replacement',
      description: 'Front and rear ceramic brake pad replacement and rotor resurfacing due to audible wear indicator.',
      cost: 380.00,
      invoice_url: 'invoices/maint_002_honda_brakes.pdf',
      next_service_odometer: 38200,
      next_service_date: '2026-10-15',
      status: 'scheduled'
    },
    {
      id: 3,
      vehicle_id: 4, // Chevrolet Suburban Premier (PR-2024-CS), 38,900 mi
      vendor_id: 2, // Jiffy Lube
      service_date: '2026-11-16',
      odometer: 38900,
      service_type: 'Transmission Flush & Fluid Service',
      description: 'Full transmission fluid evacuation, pan gasket replacement, and diagnostic shift solenoid scan. Vehicle currently in bay.',
      cost: 520.00,
      invoice_url: 'invoices/maint_003_chevy_transmission.pdf',
      next_service_odometer: 68900,
      next_service_date: '2027-05-16',
      status: 'in_progress'
    },
    {
      id: 4,
      vehicle_id: 6, // Hyundai Sonata SEL (PR-2024-HS), 21,100 mi
      vendor_id: 4, // Bridgestone Commercial Tire Centers
      service_date: '2026-11-05',
      odometer: 20850,
      service_type: '4-Wheel Balance and Alignment',
      description: 'High-speed computerized wheel balancing, cross-rotation, and laser toe/camber realignment.',
      cost: 165.00,
      invoice_url: 'invoices/maint_004_hyundai_alignment.pdf',
      next_service_odometer: 26850,
      next_service_date: '2027-05-05',
      status: 'completed'
    },
    {
      id: 5,
      vehicle_id: 5, // Ford Transit 250 Cargo (PR-2024-FT), 32,400 mi
      vendor_id: 2, // Jiffy Lube
      service_date: '2026-10-28',
      odometer: 32000,
      service_type: 'Commercial Multi-Point Inspection & Belts',
      description: 'Serpentine belt replacement, tensioner pulley check, cooling system pressure test, and alternator load test.',
      cost: 310.00,
      invoice_url: 'invoices/maint_005_ford_belts.pdf',
      next_service_odometer: 47000,
      next_service_date: '2027-04-28',
      status: 'completed'
    },
    {
      id: 6,
      vehicle_id: 3, // Tesla Model 3 Long Range (PR-2024-EV), 14,300 mi
      vendor_id: 10, // ChargePoint / EV Fleet
      service_date: '2026-11-20', // Within 3 days -> Due Soon
      odometer: 14300,
      service_type: 'EV Battery Coolant & Cabin HEPA Filter',
      description: 'High-voltage battery thermal loop coolant inspection and dual cabin HEPA microfilter replacement.',
      cost: 185.00,
      invoice_url: 'invoices/maint_006_tesla_filter.pdf',
      next_service_odometer: 24300,
      next_service_date: '2026-11-20',
      status: 'scheduled'
    }
  ];

  await knex('maintenance_records').insert(records);
};
