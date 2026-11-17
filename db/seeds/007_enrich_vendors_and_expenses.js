/**
 * Enrich Vendors with detailed contractual notes and add historical realistic fleet expenses
 */
const db = require('../../src/config/db');

async function run() {
  console.log('--- ENRICHING VENDORS MASTER DATA ---');

  // 1. Update existing 8 vendors with rich terms and notes
  await db('vendors').where({ id: 1 }).update({
    name: 'Shell Fleet Solutions',
    category: 'other',
    service_type: 'Fuel & EV Charging Programs',
    contact_person: 'Arthur Collins (Regional Fleet Account Mgr)',
    phone: '+1 (800) 555-7435',
    email: 'commercial.fleet@shell.com',
    address: 'One Shell Plaza, Houston, TX 77002',
    terms: 'Net 30 Auto-Debit',
    notes: 'National fuel discount program ($0.15/gal off diesel & unleaded) with RFID keyfob depot tracking integration.',
    status: 'active'
  });

  await db('vendors').where({ id: 2 }).update({
    name: 'Jiffy Lube Fleet Maintenance',
    category: 'repairs',
    service_type: 'Scheduled PM & Mechanical Overhauls',
    contact_person: 'Dave Reynolds (Senior Fleet Technician)',
    phone: '+1 (800) 555-5823',
    email: 'service.fleet@jiffylube.com',
    address: '144 Fleet Way, Flushing, NY 11354',
    terms: 'Net 30',
    notes: 'National fleet service tier 1. Standard 30-point preventative safety inspection included on every scheduled service.',
    status: 'active'
  });

  await db('vendors').where({ id: 3 }).update({
    name: 'Travelers Commercial Auto & Marine',
    category: 'insurance',
    service_type: 'Commercial Master Auto & Liability Coverage',
    contact_person: 'Arthur Pendelton (Senior Fleet Underwriter)',
    phone: '+1 (800) 555-8728',
    email: 'commercial.claims@travelers.com',
    address: 'One Tower Square, Hartford, CT 06183',
    terms: 'Net 30',
    notes: 'Master Fleet Auto Policy TRV-CA-9821034-25. $1,000,000 Combined Single Limit (CSL) comprehensive and collision coverage.',
    status: 'active'
  });

  await db('vendors').where({ id: 4 }).update({
    name: 'Bridgestone Commercial Tire Centers',
    category: 'tires',
    service_type: 'Tires, Balancing & Fleet Alignment',
    contact_person: 'Greg Miller (Commercial Fleet Specialist)',
    phone: '+1 (800) 555-8473',
    email: 'commercial.tires@bridgestone.com',
    address: '500 Bridgestone Way, Nashville, TN 37214',
    terms: 'Net 30',
    notes: 'Tier-1 commercial pricing. 24-Hour emergency roadside blowout tire dispatch and computerized dynamic wheel alignment.',
    status: 'active'
  });

  await db('vendors').where({ id: 5 }).update({
    name: 'New York State Thruway / E-ZPass Commercial',
    category: 'tolls',
    service_type: 'Electronic Tollways & Commercial Gateways',
    contact_person: 'Toll Account Operations Center',
    phone: '+1 (800) 555-3972',
    email: 'commercial@e-zpassny.com',
    address: '200 Southern Blvd, Albany, NY 12209',
    terms: 'Auto-Debit Escrow',
    notes: 'Consolidated commercial account covering all fleet transponders across MTA Bridges, Tunnels and Port Authority crossings.',
    status: 'active'
  });

  await db('vendors').where({ id: 6 }).update({
    name: 'CleanCar Express Fleet Detailing',
    category: 'cleaning',
    service_type: 'Vehicle Sanitization & Detailing',
    contact_person: 'Maria Santos (Operations Lead)',
    phone: '+1 (800) 555-2532',
    email: 'detailing@cleancar.io',
    address: '88 Atlantic Ave, Brooklyn, NY 11201',
    terms: 'Weekly Account',
    notes: 'Turnaround deep extraction, steam interior sanitization, and exterior ceramic wash before driver lease redeployment.',
    status: 'active'
  });

  await db('vendors').where({ id: 7 }).update({
    name: 'Samsara IoT Telematics',
    category: 'software',
    service_type: 'Cloud IoT Telematics & AI Dashcam GPS',
    contact_person: 'Enterprise Solutions Desk',
    phone: '+1 (800) 555-7267',
    email: 'support@samsara.com',
    address: '1 De Haro St, San Francisco, CA 94107',
    terms: 'Quarterly ACH',
    notes: 'Dual-facing AI dashcams, live CAN-bus engine telematics, real-time geofence tracking, and automated DVIR inspection logs.',
    status: 'active'
  });

  await db('vendors').where({ id: 8 }).update({
    name: 'Paramount Depot Logistics',
    category: 'other',
    service_type: 'Depot Yard Staging & Facility Lease',
    contact_person: 'Facility Management Desk',
    email: 'leasing@paramountlogistics.com',
    phone: '+1 (800) 555-9012',
    address: '500 Madison Ave, New York, NY 10022',
    terms: 'Net 30',
    notes: 'Primary dispatch depot yard facility, 24/7 guarded security gate, vehicle storage bays, and administrative staging suites.',
    status: 'active'
  });

  // 2. Add 2 More Real Industry Partners (Towing & EV Infrastructure)
  const existingV9 = await db('vendors').where({ id: 9 }).first();
  if (!existingV9) {
    await db('vendors').insert({
      id: 9,
      name: 'Metro Heavy Duty Towing & Recovery',
      category: 'towing',
      service_type: '24/7 Roadside Recovery & Flatbed Transport',
      contact_person: 'Bill Henderson (Dispatch Supervisor)',
      phone: '+1 (800) 555-8697',
      email: 'dispatch@metrotowing.com',
      address: '750 Bruckner Blvd, Bronx, NY 10455',
      terms: 'Net 30',
      notes: 'Dedicated fleet towing contract. Guaranteed 45-minute response time across New York City and outer boroughs.',
      status: 'active'
    });
    console.log('Inserted Vendor 9: Metro Towing');
  }

  const existingV10 = await db('vendors').where({ id: 10 }).first();
  if (!existingV10) {
    await db('vendors').insert({
      id: 10,
      name: 'ChargePoint Commercial Fleet Solutions',
      category: 'other',
      service_type: 'Depot DC Fast Charging & Energy Gateway',
      contact_person: 'Elena Vance (Fleet Electrification Director)',
      phone: '+1 (800) 555-2447',
      email: 'fleet.charging@chargepoint.com',
      address: '240 E Hacienda Ave, Campbell, CA 95008',
      terms: 'Net 30 Auto-Debit',
      notes: 'Enterprise Level-3 DC rapid charging infrastructure and smart cloud energy load balancer for commercial fleet EVs.',
      status: 'active'
    });
    console.log('Inserted Vendor 10: ChargePoint');
  }

  // 3. Add Real Historical Expenses Across Last 4 Months for all vendors
  const historicalExpenses = [
    // Shell (Vendor 1)
    { vehicle_id: 1, vendor_id: 1, recorded_by: 1, approver_id: 1, category: 'other', amount: 3850.00, expense_date: '2026-08-15', payment_method: 'bank_transfer', status: 'paid', description: 'Commercial Shell Fleet Card Fuel Statement - August Fleet Batch' },
    { vehicle_id: 2, vendor_id: 1, recorded_by: 1, approver_id: 1, category: 'other', amount: 4120.00, expense_date: '2026-09-15', payment_method: 'bank_transfer', status: 'paid', description: 'Commercial Shell Fleet Card Fuel Statement - September Fleet Batch' },
    { vehicle_id: 3, vendor_id: 1, recorded_by: 1, approver_id: 1, category: 'other', amount: 4390.00, expense_date: '2026-10-15', payment_method: 'bank_transfer', status: 'paid', description: 'Commercial Shell Fleet Card Fuel Statement - October Fleet Batch' },

    // Jiffy Lube (Vendor 2)
    { vehicle_id: 1, vendor_id: 2, recorded_by: 1, approver_id: 1, category: 'repairs', amount: 1650.00, expense_date: '2026-08-22', payment_method: 'bank_transfer', status: 'paid', description: 'Brake pads, transmission fluid service, synthetic oil changes (3 Units)' },
    { vehicle_id: 2, vendor_id: 2, recorded_by: 1, approver_id: 1, category: 'repairs', amount: 1480.00, expense_date: '2026-09-28', payment_method: 'bank_transfer', status: 'paid', description: 'Scheduled 15,000-mile preventative maintenance & filter renewals (2 Units)' },
    { vehicle_id: 3, vendor_id: 2, recorded_by: 1, approver_id: 1, category: 'repairs', amount: 1950.00, expense_date: '2026-10-24', payment_method: 'bank_transfer', status: 'paid', description: 'Catalytic converter sensor check, spark plugs & coolant flush (Chevrolet Suburban)' },

    // Travelers (Vendor 3)
    { vehicle_id: null, vendor_id: 3, recorded_by: 1, approver_id: 1, category: 'insurance', amount: 8900.00, expense_date: '2026-05-15', payment_method: 'bank_transfer', status: 'paid', description: 'Master Fleet Auto Insurance Policy Premium - Q2 Installment' },
    { vehicle_id: null, vendor_id: 3, recorded_by: 1, approver_id: 1, category: 'insurance', amount: 8900.00, expense_date: '2026-08-15', payment_method: 'bank_transfer', status: 'paid', description: 'Master Fleet Auto Insurance Policy Premium - Q3 Installment' },

    // Bridgestone (Vendor 4)
    { vehicle_id: 1, vendor_id: 4, recorded_by: 1, approver_id: 1, category: 'tires', amount: 980.00, expense_date: '2026-08-10', payment_method: 'bank_transfer', status: 'paid', description: 'Four WeatherPeak all-season tires & precision high-speed alignment (Camry)' },
    { vehicle_id: 2, vendor_id: 4, recorded_by: 1, approver_id: 1, category: 'tires', amount: 1150.00, expense_date: '2026-09-18', payment_method: 'bank_transfer', status: 'paid', description: 'Four Ecopia low-rolling-resistance fleet tires (Tesla Model 3)' },
    { vehicle_id: 3, vendor_id: 4, recorded_by: 1, approver_id: 1, category: 'tires', amount: 890.00, expense_date: '2026-10-12', payment_method: 'bank_transfer', status: 'paid', description: 'Two steer axle commercial heavy-duty tires (Ford Transit 250)' },

    // E-ZPass (Vendor 5)
    { vehicle_id: null, vendor_id: 5, recorded_by: 1, approver_id: 1, category: 'tolls', amount: 1320.00, expense_date: '2026-08-31', payment_method: 'bank_transfer', status: 'paid', description: 'E-ZPass NY Regional Commercial Gateway Toll Statement - August' },
    { vehicle_id: null, vendor_id: 5, recorded_by: 1, approver_id: 1, category: 'tolls', amount: 1410.00, expense_date: '2026-09-30', payment_method: 'bank_transfer', status: 'paid', description: 'E-ZPass NY Regional Commercial Gateway Toll Statement - September' },
    { vehicle_id: null, vendor_id: 5, recorded_by: 1, approver_id: 1, category: 'tolls', amount: 1380.00, expense_date: '2026-10-31', payment_method: 'bank_transfer', status: 'paid', description: 'E-ZPass NY Regional Commercial Gateway Toll Statement - October' },

    // CleanCar (Vendor 6)
    { vehicle_id: null, vendor_id: 6, recorded_by: 1, approver_id: 1, category: 'cleaning', amount: 450.00, expense_date: '2026-08-30', payment_method: 'bank_transfer', status: 'paid', description: 'Complete Fleet Bi-Weekly Interior Sanitization & Exterior Washing - August' },
    { vehicle_id: null, vendor_id: 6, recorded_by: 1, approver_id: 1, category: 'cleaning', amount: 480.00, expense_date: '2026-09-30', payment_method: 'bank_transfer', status: 'paid', description: 'Complete Fleet Bi-Weekly Interior Sanitization & Exterior Washing - September' },
    { vehicle_id: null, vendor_id: 6, recorded_by: 1, approver_id: 1, category: 'cleaning', amount: 520.00, expense_date: '2026-10-30', payment_method: 'bank_transfer', status: 'paid', description: 'Complete Fleet Bi-Weekly Interior Sanitization & Exterior Washing - October' },

    // Samsara (Vendor 7)
    { vehicle_id: null, vendor_id: 7, recorded_by: 1, approver_id: 1, category: 'software', amount: 650.00, expense_date: '2026-08-01', payment_method: 'bank_transfer', status: 'paid', description: 'Samsara Cloud IoT Telematics, Dashcam AI & Live GPS Tracking - August' },
    { vehicle_id: null, vendor_id: 7, recorded_by: 1, approver_id: 1, category: 'software', amount: 650.00, expense_date: '2026-09-01', payment_method: 'bank_transfer', status: 'paid', description: 'Samsara Cloud IoT Telematics, Dashcam AI & Live GPS Tracking - September' },
    { vehicle_id: null, vendor_id: 7, recorded_by: 1, approver_id: 1, category: 'software', amount: 650.00, expense_date: '2026-10-01', payment_method: 'bank_transfer', status: 'paid', description: 'Samsara Cloud IoT Telematics, Dashcam AI & Live GPS Tracking - October' },

    // Paramount Depot (Vendor 8)
    { vehicle_id: null, vendor_id: 8, recorded_by: 1, approver_id: 1, category: 'office', amount: 3500.00, expense_date: '2026-08-01', payment_method: 'bank_transfer', status: 'paid', description: 'Dispatch Depot Yard Lease & Staging Grounds Rental - August' },
    { vehicle_id: null, vendor_id: 8, recorded_by: 1, approver_id: 1, category: 'office', amount: 3500.00, expense_date: '2026-09-01', payment_method: 'bank_transfer', status: 'paid', description: 'Dispatch Depot Yard Lease & Staging Grounds Rental - September' },

    // Metro Towing (Vendor 9)
    { vehicle_id: 2, vendor_id: 9, recorded_by: 1, approver_id: 1, category: 'towing', amount: 320.00, expense_date: '2026-09-14', payment_method: 'bank_transfer', status: 'paid', description: 'Flatbed recovery & vehicle depot transport following alternator stall (Accord)' },
    { vehicle_id: 4, vendor_id: 9, recorded_by: 1, approver_id: 1, category: 'towing', amount: 450.00, expense_date: '2026-10-22', payment_method: 'bank_transfer', status: 'approved', description: 'Heavy-duty wheel-lift towing & winch recovery (Transit 250 Cargo Unit)' },

    // ChargePoint (Vendor 10)
    { vehicle_id: 3, vendor_id: 10, recorded_by: 1, approver_id: 1, category: 'other', amount: 840.00, expense_date: '2026-09-30', payment_method: 'bank_transfer', status: 'paid', description: 'Level-3 DC Rapid Charge Electric Power Draw & Cloud Gateway Subscription - September' },
    { vehicle_id: 3, vendor_id: 10, recorded_by: 1, approver_id: 1, category: 'other', amount: 960.00, expense_date: '2026-10-31', payment_method: 'bank_transfer', status: 'paid', description: 'Level-3 DC Rapid Charge Electric Power Draw & Cloud Gateway Subscription - October' }
  ];

  // Insert only if not already present
  for (const exp of historicalExpenses) {
    const existing = await db('expenses')
      .where({
        vendor_id: exp.vendor_id,
        amount: exp.amount,
        expense_date: exp.expense_date
      })
      .first();

    if (!existing) {
      await db('expenses').insert(exp);
    }
  }

  console.log('--- ENRICHMENT COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

run().catch((err) => {
  console.error('Enrichment failed:', err);
  process.exit(1);
});
