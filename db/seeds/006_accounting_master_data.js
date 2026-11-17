/**
 * PrimeRoute Master Accounting Seed Data
 * Populates real vehicles, drivers, rentals, vendors, ledger entries, invoices, and expenses
 * to ensure 100% database-driven operation with zero mock fallbacks.
 */

exports.seed = async function (knex) {
  // 1. Ensure Drivers Exist
  const driversData = [
    {
      id: 1,
      first_name: 'Marcus',
      last_name: 'Vance',
      phone: '+1 (555) 234-8901',
      email: 'marcus.vance@primeroute.io',
      license_number: 'DL-NY-9028148',
      license_state: 'NY',
      license_expiry: '2027-09-14',
      status: 'active',
      balance: 0.00,
      deposit_held: 500.00,
      notes: 'Driver with Apex Logistics contract.'
    },
    {
      id: 2,
      first_name: 'David',
      last_name: 'Miller',
      phone: '+1 (555) 345-6712',
      email: 'david.miller@primeroute.io',
      license_number: 'DL-CA-4491029',
      license_state: 'CA',
      license_expiry: '2027-11-20',
      status: 'active',
      balance: 0.00,
      deposit_held: 600.00,
      notes: 'Commercial delivery driver.'
    },
    {
      id: 3,
      first_name: 'Sarah',
      last_name: 'Jenkins',
      phone: '+1 (555) 456-7890',
      email: 'sjenkins@primeroute.io',
      license_number: 'DL-IL-8849103',
      license_state: 'IL',
      license_expiry: '2027-04-18',
      status: 'active',
      balance: 0.00,
      deposit_held: 800.00,
      notes: 'Urban Express Services contractor.'
    },
    {
      id: 4,
      first_name: 'Alexander',
      last_name: 'Reed',
      phone: '+1 (555) 567-8901',
      email: 'alex.reed@primeroute.io',
      license_number: 'DL-TX-5510928',
      license_state: 'TX',
      license_expiry: '2028-01-10',
      status: 'active',
      balance: 0.00,
      deposit_held: 750.00,
      notes: 'Green Mobility Corp EV driver.'
    },
    {
      id: 5,
      first_name: 'Elena',
      last_name: 'Rostova',
      phone: '+1 (555) 678-9012',
      email: 'elena.rostova@primeroute.io',
      license_number: 'DL-FL-7729104',
      license_state: 'FL',
      license_expiry: '2027-07-25',
      status: 'active',
      balance: 0.00,
      deposit_held: 1000.00,
      notes: 'Executive livery service chauffeur.'
    }
  ];

  for (const d of driversData) {
    const existing = await knex('drivers').where({ id: d.id }).first();
    if (!existing) {
      await knex('drivers').insert(d);
    } else {
      await knex('drivers').where({ id: d.id }).update(d);
    }
  }

  // 2. Ensure Vehicles Exist
  const vehiclesData = [
    {
      id: 1,
      vin: '4T1B11HK5JU192831',
      plate: 'PR-2024-TC',
      make: 'Toyota',
      model: 'Camry SE',
      year: 2024,
      color: 'Midnight Black',
      mileage: 24500,
      status: 'rented',
      purchase_date: '2024-01-15',
      purchase_price: 28500.00,
      financing_details: 'Commercial Fleet Finance LLC',
      location: 'JFK Airport Fleet Hub'
    },
    {
      id: 2,
      vin: '1HGCR2F83HA029341',
      plate: 'PR-2024-HA',
      make: 'Honda',
      model: 'Accord Sport',
      year: 2024,
      color: 'Platinum White',
      mileage: 18200,
      status: 'rented',
      purchase_date: '2024-02-20',
      purchase_price: 29800.00,
      financing_details: 'Direct Capital',
      location: 'LAX Cargo Hub'
    },
    {
      id: 3,
      vin: '5YJ3E1EB8NF839210',
      plate: 'PR-2024-EV',
      make: 'Tesla',
      model: 'Model 3 Long Range',
      year: 2024,
      color: 'Deep Blue Metallic',
      mileage: 14300,
      status: 'rented',
      purchase_date: '2024-03-10',
      purchase_price: 44000.00,
      financing_details: 'Tesla Financial Services',
      location: 'Austin Domain Tech Center'
    },
    {
      id: 4,
      vin: '1GNSKBKC9PR901842',
      plate: 'PR-2024-CS',
      make: 'Chevrolet',
      model: 'Suburban Premier',
      year: 2023,
      color: 'Summit White',
      mileage: 38900,
      status: 'rented',
      purchase_date: '2023-04-14',
      purchase_price: 64500.00,
      financing_details: 'Fleet Lease Corp',
      location: 'Metro Service Facility'
    },
    {
      id: 5,
      vin: '1FTFW1ED6PFB92841',
      plate: 'PR-2024-FT',
      make: 'Ford',
      model: 'Transit 250 Cargo',
      year: 2023,
      color: 'Oxford White',
      mileage: 32400,
      status: 'rented',
      purchase_date: '2023-05-11',
      purchase_price: 52000.00,
      financing_details: 'Direct Capital',
      location: 'Central Dispatch Yard'
    },
    {
      id: 6,
      vin: '5NPE24AF9NH194821',
      plate: 'PR-2024-HS',
      make: 'Hyundai',
      model: 'Sonata SEL',
      year: 2024,
      color: 'Electric Shadow',
      mileage: 21100,
      status: 'available',
      purchase_date: '2024-01-10',
      purchase_price: 26200.00,
      financing_details: 'Paid in Full',
      location: 'Chicago Midway Hub'
    }
  ];

  for (const v of vehiclesData) {
    const existing = await knex('vehicles').where({ id: v.id }).first();
    if (!existing) {
      await knex('vehicles').insert(v);
    } else {
      await knex('vehicles').where({ id: v.id }).update(v);
    }
  }

  // 3. Ensure Rentals Exist
  const rentalsData = [
    {
      id: 1,
      contract_no: 'RNT-2024-089',
      vehicle_id: 1,
      driver_id: 1,
      created_by: 1,
      status: 'active',
      start_date: '2026-07-01',
      end_date: '2026-12-31',
      weekly_rate: 488.00,
      deposit_amount: 500.00,
      mileage_at_pickup: 20000,
      terms: 'Standard commercial vehicle lease agreement'
    },
    {
      id: 2,
      contract_no: 'RNT-2024-090',
      vehicle_id: 2,
      driver_id: 2,
      created_by: 1,
      status: 'active',
      start_date: '2026-08-01',
      end_date: '2026-12-31',
      weekly_rate: 475.00,
      deposit_amount: 600.00,
      mileage_at_pickup: 15000,
      terms: 'Commercial delivery driver contract'
    },
    {
      id: 3,
      contract_no: 'RNT-2024-091',
      vehicle_id: 3,
      driver_id: 4,
      created_by: 1,
      status: 'active',
      start_date: '2026-09-01',
      end_date: '2026-12-31',
      weekly_rate: 525.00,
      deposit_amount: 750.00,
      mileage_at_pickup: 10000,
      terms: 'EV rideshare lease agreement'
    },
    {
      id: 4,
      contract_no: 'RNT-2024-092',
      vehicle_id: 4,
      driver_id: 3,
      created_by: 1,
      status: 'active',
      start_date: '2026-08-15',
      end_date: '2026-12-31',
      weekly_rate: 590.00,
      deposit_amount: 800.00,
      mileage_at_pickup: 35000,
      terms: 'Urban logistics commercial lease'
    },
    {
      id: 5,
      contract_no: 'RNT-2024-093',
      vehicle_id: 5,
      driver_id: 5,
      created_by: 1,
      status: 'active',
      start_date: '2026-09-15',
      end_date: '2026-12-31',
      weekly_rate: 650.00,
      deposit_amount: 1000.00,
      mileage_at_pickup: 28000,
      terms: 'Executive livery and cargo agreement'
    }
  ];

  for (const r of rentalsData) {
    const existing = await knex('rentals').where({ id: r.id }).first();
    if (!existing) {
      await knex('rentals').insert(r);
    } else {
      await knex('rentals').where({ id: r.id }).update(r);
    }
  }

  // 4. Ensure Vendors Exist
  const vendorsData = [
    {
      id: 1,
      name: 'Shell Fleet Solutions',
      service_type: 'Fuel & Fleet Card',
      contact_person: 'Corporate Fleet Desk',
      email: 'fleet.cards@shell.com',
      phone: '+1 (800) 555-7435',
      address: 'Shell Oil Co, Houston, TX',
      status: 'active'
    },
    {
      id: 2,
      name: 'Jiffy Lube Fleet Maintenance',
      service_type: 'Routine Maintenance',
      contact_person: 'Dave Reynolds',
      email: 'service@jiffylube.com',
      phone: '+1 (800) 555-5823',
      address: '144 Fleet Way, Flushing, NY',
      status: 'active'
    },
    {
      id: 3,
      name: 'Travelers Commercial Auto & Marine',
      service_type: 'Fleet Auto Insurance',
      contact_person: 'Arthur Pendelton',
      email: 'commercial.claims@travelers.com',
      phone: '+1 (800) 555-8728',
      address: 'One Tower Square, Hartford, CT',
      status: 'active'
    },
    {
      id: 4,
      name: 'Bridgestone Commercial Tire Centers',
      service_type: 'Tires & Wheel Alignment',
      contact_person: 'Greg Miller',
      email: 'commercial@bridgestone.com',
      phone: '+1 (800) 555-8473',
      address: '500 Bridgestone Way, Nashville, TN',
      status: 'active'
    },
    {
      id: 5,
      name: 'New York State Thruway / E-ZPass Commercial',
      service_type: 'Tolls & Highway Transponders',
      contact_person: 'Toll Account Operations',
      email: 'commercial@e-zpassny.com',
      phone: '+1 (800) 555-3972',
      address: '200 Southern Blvd, Albany, NY',
      status: 'active'
    },
    {
      id: 6,
      name: 'CleanCar Express Fleet Detailing',
      service_type: 'Vehicle Sanitization & Detailing',
      contact_person: 'Maria Santos',
      email: 'detailing@cleancar.io',
      phone: '+1 (800) 555-2532',
      address: '88 Atlantic Ave, Brooklyn, NY',
      status: 'active'
    },
    {
      id: 7,
      name: 'Samsara IoT Telematics',
      service_type: 'Software Subscriptions & GPS',
      contact_person: 'Enterprise Support',
      email: 'support@samsara.com',
      phone: '+1 (800) 555-7267',
      address: '1 De Haro St, San Francisco, CA',
      status: 'active'
    },
    {
      id: 8,
      name: 'Paramount Depot Logistics',
      service_type: 'Depot Yard Facility Lease',
      contact_person: 'Facility Management',
      email: 'leasing@paramountlogistics.com',
      phone: '+1 (800) 555-9012',
      address: '500 Madison Ave, New York, NY',
      status: 'active'
    }
  ];

  for (const vd of vendorsData) {
    const existing = await knex('vendors').where({ id: vd.id }).first();
    if (!existing) {
      await knex('vendors').insert(vd);
    } else {
      await knex('vendors').where({ id: vd.id }).update(vd);
    }
  }

  // 5. Clean & Reseed Accounting Tables
  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  await knex('ledger_entries').truncate();
  await knex('expenses').truncate();
  await knex('invoice_items').truncate();
  await knex('invoices').truncate();
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');

  // -------------------------------------------------------------
  // A. LEDGER ENTRIES: CHARGES (Debit Subledger)
  // -------------------------------------------------------------
  const charges = [
    {
      id: 1,
      driver_id: 1,
      rental_id: 1,
      entry_type: 'charge',
      amount: 488.00,
      category: 'Weekly Lease',
      description: 'Vehicle Lease (Toyota Camry PR-2024-TC) - Wk 46',
      status: 'Paid',
      qbo_ref: 'QBO-CHG-1021',
      driver_name: 'Marcus Vance',
      rental_code: 'RNT-2024-089',
      entry_date: '2026-11-01',
      metadata: JSON.stringify({ vehicle: 'Toyota Camry SE (PR-2024-TC)' })
    },
    {
      id: 2,
      driver_id: 1,
      rental_id: 1,
      entry_type: 'charge',
      amount: 33.00,
      category: 'Toll Charges',
      description: 'E-ZPass Toll Summary (George Washington Bridge / RFK)',
      status: 'Posted',
      qbo_ref: 'Pending Sync',
      driver_name: 'Marcus Vance',
      rental_code: 'RNT-2024-089',
      entry_date: '2026-11-13',
      metadata: JSON.stringify({ vehicle: 'Toyota Camry SE (PR-2024-TC)' })
    },
    {
      id: 3,
      driver_id: 1,
      rental_id: 1,
      entry_type: 'charge',
      amount: 55.00,
      category: 'Excess Mileage Fee',
      description: 'Excess Mileage (220 mi over allowable weekly cap)',
      status: 'Posted',
      qbo_ref: 'Pending Sync',
      driver_name: 'Marcus Vance',
      rental_code: 'RNT-2024-089',
      entry_date: '2026-11-14',
      metadata: JSON.stringify({ vehicle: 'Toyota Camry SE (PR-2024-TC)' })
    },
    {
      id: 4,
      driver_id: 2,
      rental_id: 2,
      entry_type: 'charge',
      amount: 475.00,
      category: 'Weekly Lease',
      description: 'Vehicle Lease (Honda Accord Sport PR-2024-HA) - Wk 46',
      status: 'Paid',
      qbo_ref: 'QBO-CHG-1022',
      driver_name: 'David Miller',
      rental_code: 'RNT-2024-090',
      entry_date: '2026-11-02',
      metadata: JSON.stringify({ vehicle: 'Honda Accord Sport (PR-2024-HA)' })
    },
    {
      id: 5,
      driver_id: 2,
      rental_id: 2,
      entry_type: 'charge',
      amount: 42.00,
      category: 'Toll Charges',
      description: 'E-ZPass Lincoln Tunnel Toll Re-charge',
      status: 'Paid',
      qbo_ref: 'QBO-CHG-1023',
      driver_name: 'David Miller',
      rental_code: 'RNT-2024-090',
      entry_date: '2026-11-10',
      metadata: JSON.stringify({ vehicle: 'Honda Accord Sport (PR-2024-HA)' })
    },
    {
      id: 6,
      driver_id: 4,
      rental_id: 3,
      entry_type: 'charge',
      amount: 525.00,
      category: 'Weekly Lease',
      description: 'Commercial EV Lease (Tesla Model 3 PR-2024-EV) - Wk 46',
      status: 'Paid',
      qbo_ref: 'QBO-CHG-1024',
      driver_name: 'Alexander Reed',
      rental_code: 'RNT-2024-091',
      entry_date: '2026-11-03',
      metadata: JSON.stringify({ vehicle: 'Tesla Model 3 (PR-2024-EV)' })
    },
    {
      id: 7,
      driver_id: 4,
      rental_id: 3,
      entry_type: 'charge',
      amount: 28.00,
      category: 'Toll Charges',
      description: 'MTA Throgs Neck Toll Surcharge',
      status: 'Posted',
      qbo_ref: 'Pending Sync',
      driver_name: 'Alexander Reed',
      rental_code: 'RNT-2024-091',
      entry_date: '2026-11-12',
      metadata: JSON.stringify({ vehicle: 'Tesla Model 3 (PR-2024-EV)' })
    },
    {
      id: 8,
      driver_id: 3,
      rental_id: 4,
      entry_type: 'charge',
      amount: 590.00,
      category: 'Weekly Lease',
      description: 'Executive Charter Lease (Suburban PR-2024-CS) - Wk 46',
      status: 'Paid',
      qbo_ref: 'QBO-CHG-1025',
      driver_name: 'Sarah Jenkins',
      rental_code: 'RNT-2024-092',
      entry_date: '2026-11-04',
      metadata: JSON.stringify({ vehicle: 'Chevrolet Suburban Premier (PR-2024-CS)' })
    },
    {
      id: 9,
      driver_id: 3,
      rental_id: 4,
      entry_type: 'charge',
      amount: 65.00,
      category: 'Toll & Fine Re-charge',
      description: 'Port Authority Bus Lane Violation Re-charge',
      status: 'Posted',
      qbo_ref: 'Pending Sync',
      driver_name: 'Sarah Jenkins',
      rental_code: 'RNT-2024-092',
      entry_date: '2026-11-11',
      metadata: JSON.stringify({ vehicle: 'Chevrolet Suburban Premier (PR-2024-CS)' })
    },
    {
      id: 10,
      driver_id: 3,
      rental_id: 4,
      entry_type: 'charge',
      amount: 45.00,
      category: 'Cleaning Fee',
      description: 'Post-charter interior sanitation & disinfection',
      status: 'Posted',
      qbo_ref: 'Pending Sync',
      driver_name: 'Sarah Jenkins',
      rental_code: 'RNT-2024-092',
      entry_date: '2026-11-14',
      metadata: JSON.stringify({ vehicle: 'Chevrolet Suburban Premier (PR-2024-CS)' })
    },
    {
      id: 11,
      driver_id: 5,
      rental_id: 5,
      entry_type: 'charge',
      amount: 650.00,
      category: 'Weekly Lease',
      description: 'Commercial Cargo Fleet Lease (Transit 250 PR-2024-FT)',
      status: 'Paid',
      qbo_ref: 'QBO-CHG-1026',
      driver_name: 'Elena Rostova',
      rental_code: 'RNT-2024-093',
      entry_date: '2026-11-05',
      metadata: JSON.stringify({ vehicle: 'Ford Transit 250 Cargo (PR-2024-FT)' })
    },
    {
      id: 12,
      driver_id: 5,
      rental_id: 5,
      entry_type: 'charge',
      amount: 85.00,
      category: 'Excess Mileage Fee',
      description: 'Long haul excess route mileage (340 mi beyond cap)',
      status: 'Posted',
      qbo_ref: 'Pending Sync',
      driver_name: 'Elena Rostova',
      rental_code: 'RNT-2024-093',
      entry_date: '2026-11-15',
      metadata: JSON.stringify({ vehicle: 'Ford Transit 250 Cargo (PR-2024-FT)' })
    }
  ];

  await knex('ledger_entries').insert(charges);

  // -------------------------------------------------------------
  // B. LEDGER ENTRIES: PAYMENTS (Credit Subledger / Remittances)
  // -------------------------------------------------------------
  const payments = [
    {
      id: 13,
      driver_id: 1,
      rental_id: 1,
      entry_type: 'payment',
      amount: 488.00,
      payment_method: 'bank_transfer',
      reference_no: 'ACH-498210',
      notes: 'Weekly lease settlement via Chase Corporate ACH.',
      status: 'Paid',
      qbo_ref: 'QBO-PMT-8841',
      driver_name: 'Marcus Vance',
      rental_code: 'RNT-2024-089',
      entry_date: '2026-11-02',
      metadata: JSON.stringify({
        dueDate: '2026-11-05',
        displayMethod: 'Corporate ACH',
        receiptNo: 'REC-2026-001'
      })
    },
    {
      id: 14,
      driver_id: 2,
      rental_id: 2,
      entry_type: 'payment',
      amount: 517.00,
      payment_method: 'card',
      reference_no: 'POS-882103',
      notes: 'Weekly lease + toll settlement via Business Debit Card.',
      status: 'Paid',
      qbo_ref: 'QBO-PMT-8842',
      driver_name: 'David Miller',
      rental_code: 'RNT-2024-090',
      entry_date: '2026-11-11',
      metadata: JSON.stringify({
        dueDate: '2026-11-12',
        displayMethod: 'Debit Card',
        receiptNo: 'REC-2026-002'
      })
    },
    {
      id: 15,
      driver_id: 4,
      rental_id: 3,
      entry_type: 'payment',
      amount: 525.00,
      payment_method: 'bank_transfer',
      reference_no: 'WIRE-00918',
      notes: 'Tesla EV weekly charter remittance.',
      status: 'Paid',
      qbo_ref: 'QBO-PMT-8843',
      driver_name: 'Alexander Reed',
      rental_code: 'RNT-2024-091',
      entry_date: '2026-11-04',
      metadata: JSON.stringify({
        dueDate: '2026-11-07',
        displayMethod: 'Bank Wire',
        receiptNo: 'REC-2026-003'
      })
    },
    {
      id: 16,
      driver_id: 3,
      rental_id: 4,
      entry_type: 'payment',
      amount: 590.00,
      payment_method: 'bank_transfer',
      reference_no: 'ACH-661029',
      notes: 'Suburban weekly lease payment.',
      status: 'Paid',
      qbo_ref: 'QBO-PMT-8844',
      driver_name: 'Sarah Jenkins',
      rental_code: 'RNT-2024-092',
      entry_date: '2026-11-06',
      metadata: JSON.stringify({
        dueDate: '2026-11-09',
        displayMethod: 'Corporate ACH',
        receiptNo: 'REC-2026-004'
      })
    },
    {
      id: 17,
      driver_id: 5,
      rental_id: 5,
      entry_type: 'payment',
      amount: 650.00,
      payment_method: 'zelle',
      reference_no: 'ZEL-990142',
      notes: 'Cargo van commercial lease remittance.',
      status: 'Paid',
      qbo_ref: 'QBO-PMT-8845',
      driver_name: 'Elena Rostova',
      rental_code: 'RNT-2024-093',
      entry_date: '2026-11-07',
      metadata: JSON.stringify({
        dueDate: '2026-11-10',
        displayMethod: 'Zelle Direct',
        receiptNo: 'REC-2026-005'
      })
    }
  ];

  await knex('ledger_entries').insert(payments);

  // -------------------------------------------------------------
  // C. LEDGER ENTRIES: DEPOSITS (Escrow Liability - Account 2100)
  // -------------------------------------------------------------
  const deposits = [
    {
      id: 18,
      driver_id: 1,
      rental_id: 1,
      entry_type: 'deposit',
      amount: 500.00,
      status: 'Held in Escrow',
      driver_name: 'Marcus Vance',
      rental_code: 'RNT-2024-089',
      entry_date: '2026-07-01',
      notes: 'Customer security deposit held in segregated escrow.',
      metadata: JSON.stringify({
        vehicle: 'Toyota Camry SE (PR-2024-TC)',
        deductions: 0,
        balance: 500.00
      })
    },
    {
      id: 19,
      driver_id: 2,
      rental_id: 2,
      entry_type: 'deposit',
      amount: 600.00,
      status: 'Held in Escrow',
      driver_name: 'David Miller',
      rental_code: 'RNT-2024-090',
      entry_date: '2026-08-01',
      notes: 'Customer security deposit held in escrow account 2100.',
      metadata: JSON.stringify({
        vehicle: 'Honda Accord Sport (PR-2024-HA)',
        deductions: 0,
        balance: 600.00
      })
    },
    {
      id: 20,
      driver_id: 4,
      rental_id: 3,
      entry_type: 'deposit',
      amount: 750.00,
      status: 'Held in Escrow',
      driver_name: 'Alexander Reed',
      rental_code: 'RNT-2024-091',
      entry_date: '2026-09-01',
      notes: 'EV security deposit held in segregated escrow.',
      metadata: JSON.stringify({
        vehicle: 'Tesla Model 3 Long Range (PR-2024-EV)',
        deductions: 0,
        balance: 750.00
      })
    },
    {
      id: 21,
      driver_id: 3,
      rental_id: 4,
      entry_type: 'deposit',
      amount: 800.00,
      status: 'Held in Escrow',
      driver_name: 'Sarah Jenkins',
      rental_code: 'RNT-2024-092',
      entry_date: '2026-08-15',
      notes: 'Executive Suburban security deposit held in escrow.',
      metadata: JSON.stringify({
        vehicle: 'Chevrolet Suburban Premier (PR-2024-CS)',
        deductions: 0,
        balance: 800.00
      })
    },
    {
      id: 22,
      driver_id: 5,
      rental_id: 5,
      entry_type: 'deposit',
      amount: 1000.00,
      status: 'Held in Escrow',
      driver_name: 'Elena Rostova',
      rental_code: 'RNT-2024-093',
      entry_date: '2026-09-15',
      notes: 'Commercial cargo vehicle deposit held in escrow.',
      metadata: JSON.stringify({
        vehicle: 'Ford Transit 250 Cargo (PR-2024-FT)',
        deductions: 0,
        balance: 1000.00
      })
    }
  ];

  await knex('ledger_entries').insert(deposits);

  // -------------------------------------------------------------
  // D. LEDGER ENTRIES: REFUNDS (Disbursements)
  // -------------------------------------------------------------
  const refunds = [
    {
      id: 23,
      driver_id: 2,
      rental_id: 2,
      entry_type: 'refund',
      amount: 510.00,
      payment_method: 'bank_transfer',
      category: 'Security Deposit Refund',
      reference_no: 'ACH-REF-77192',
      status: 'Processed',
      driver_name: 'David Miller',
      rental_code: 'RNT-2024-090',
      entry_date: '2026-11-12',
      notes: 'Previous seasonal lease completed; deposit returned via direct ACH.',
      metadata: JSON.stringify({
        depositId: 'DEP-019',
        method: 'Direct ACH Refund',
        reason: 'Lease concluded; deposit released from escrow.'
      })
    },
    {
      id: 24,
      driver_id: 1,
      rental_id: 1,
      entry_type: 'refund',
      amount: 75.00,
      payment_method: 'card',
      category: 'Overpayment Return',
      reference_no: 'CC-REF-10928',
      status: 'Processed',
      driver_name: 'Marcus Vance',
      rental_code: 'RNT-2024-089',
      entry_date: '2026-10-27',
      notes: 'Double billing correction refund for toll dispute.',
      metadata: JSON.stringify({
        method: 'Original Payment Method',
        reason: 'Double billing correction refund'
      })
    }
  ];

  await knex('ledger_entries').insert(refunds);

  // -------------------------------------------------------------
  // E. LEDGER ENTRIES: CREDITS / ADJUSTMENTS
  // -------------------------------------------------------------
  const credits = [
    {
      id: 25,
      driver_id: 1,
      rental_id: 1,
      entry_type: 'credit',
      amount: 50.00,
      category: 'Goodwill Discount',
      status: 'Applied',
      driver_name: 'Marcus Vance',
      rental_code: 'RNT-2024-089',
      entry_date: '2026-11-08',
      notes: 'Vehicle A/C service scheduled during shift; 2-hour downtime credit.',
      metadata: JSON.stringify({
        approvedBy: 'Marcus Brody (Fleet Director)',
        reason: 'Vehicle A/C service scheduled during shift'
      })
    },
    {
      id: 26,
      driver_id: 3,
      rental_id: 4,
      entry_type: 'credit',
      amount: 25.00,
      category: 'Disputed Toll Waiver',
      status: 'Applied',
      driver_name: 'Sarah Jenkins',
      rental_code: 'RNT-2024-092',
      entry_date: '2026-11-05',
      notes: 'Duplicate toll fee waived after transponder reconciliation.',
      metadata: JSON.stringify({
        approvedBy: 'Finance Officer',
        reason: 'Duplicate toll fee waived'
      })
    },
    {
      id: 27,
      driver_id: 4,
      rental_id: 3,
      entry_type: 'credit',
      amount: 40.00,
      category: 'Promotional Credit',
      status: 'Applied',
      driver_name: 'Alexander Reed',
      rental_code: 'RNT-2024-091',
      entry_date: '2026-11-09',
      notes: 'EV charging promotional reimbursement credit.',
      metadata: JSON.stringify({
        approvedBy: 'Operations Manager',
        reason: 'EV charging promotional credit'
      })
    }
  ];

  await knex('ledger_entries').insert(credits);

  // -------------------------------------------------------------
  // F. INVOICES (Corporate Accounts Receivable)
  // -------------------------------------------------------------
  const invoices = [
    {
      id: 1,
      invoice_number: 'INV-2026-001',
      customer_name: 'Skyline Transport Co',
      vehicle_name: 'Hyundai Sonata SEL (PR-2024-HS)',
      rental_id: 1,
      driver_id: 1,
      issued_by: 1,
      issue_date: '2026-10-31',
      due_date: '2026-11-28',
      subtotal: 2850.00,
      tax: 242.00,
      total_amount: 3092.00,
      paid_amount: 0.00,
      balance: 3092.00,
      status: 'issued',
      notes: 'Net 30 commercial fleet lease invoice.'
    },
    {
      id: 2,
      invoice_number: 'INV-2026-002',
      customer_name: 'Apex Logistics Partners',
      vehicle_name: 'Toyota Camry SE (PR-2024-TC)',
      rental_id: 1,
      driver_id: 1,
      issued_by: 1,
      issue_date: '2026-11-01',
      due_date: '2026-11-20',
      subtotal: 2250.00,
      tax: 200.00,
      total_amount: 2450.00,
      paid_amount: 1200.00,
      balance: 1250.00,
      status: 'partially_paid',
      notes: 'First installment received. Second installment due Nov 20.'
    },
    {
      id: 3,
      invoice_number: 'INV-2026-003',
      customer_name: 'Urban Express Fleet Corp',
      vehicle_name: 'Chevrolet Suburban (PR-2024-CS)',
      rental_id: 4,
      driver_id: 3,
      issued_by: 1,
      issue_date: '2026-10-15',
      due_date: '2026-11-05',
      subtotal: 1700.00,
      tax: 150.00,
      total_amount: 1850.00,
      paid_amount: 0.00,
      balance: 1850.00,
      status: 'overdue',
      notes: 'Overdue commercial invoice. Second reminder notice issued.'
    },
    {
      id: 4,
      invoice_number: 'INV-2026-004',
      customer_name: 'Marcus Vance',
      vehicle_name: 'Toyota Camry SE (PR-2024-TC)',
      rental_id: 1,
      driver_id: 1,
      issued_by: 1,
      issue_date: '2026-10-31',
      due_date: '2026-11-14',
      subtotal: 450.00,
      tax: 38.00,
      total_amount: 488.00,
      paid_amount: 488.00,
      balance: 0.00,
      status: 'paid',
      notes: 'Weekly lease statement settled in full via ACH.'
    }
  ];

  await knex('invoices').insert(invoices);

  // -------------------------------------------------------------
  // G. EXPENSES / PAYABLES (Fleet OpEx & Vendor Accounts Payable)
  // -------------------------------------------------------------
  const expenses = [
    {
      id: 1,
      vendor_id: 3, // Travelers Commercial Auto
      vehicle_id: null,
      rental_id: null,
      recorded_by: 1,
      approver_id: 1,
      category: 'insurance',
      amount: 8900.00,
      expense_date: '2026-11-01',
      payment_method: 'bank_transfer',
      invoice_receipt_url: '/receipts/travelers_policy_nov2026.pdf',
      description: 'Master Commercial Auto Fleet Primary Insurance (Monthly Premium Installment)',
      status: 'approved'
    },
    {
      id: 2,
      vendor_id: 1, // Shell Fleet Solutions
      vehicle_id: 1,
      rental_id: 1,
      recorded_by: 1,
      approver_id: 1,
      category: 'parking', // Shell Fuel card mapped enum
      amount: 4250.00,
      expense_date: '2026-11-05',
      payment_method: 'card',
      invoice_receipt_url: '/receipts/shell_fleet_fuel_statement.pdf',
      description: 'Fleet Fuel Card Monthly Consolidated Settlement (18 Commercial Cards)',
      status: 'paid'
    },
    {
      id: 3,
      vendor_id: 2, // Jiffy Lube Fleet Maintenance
      vehicle_id: 1,
      rental_id: 1,
      recorded_by: 1,
      approver_id: 1,
      category: 'repairs',
      amount: 1820.00,
      expense_date: '2026-11-08',
      payment_method: 'bank_transfer',
      invoice_receipt_url: '/receipts/jiffy_lube_brakes_service.pdf',
      description: 'Routine 30k Preventative Service, Brake Rotors & Synthetic Fluid Flush (3 Units)',
      status: 'approved'
    },
    {
      id: 4,
      vendor_id: 4, // Bridgestone Commercial Tire Centers
      vehicle_id: 4,
      rental_id: 4,
      recorded_by: 1,
      approver_id: null,
      category: 'tires',
      amount: 1200.00,
      expense_date: '2026-11-12',
      payment_method: 'bank_transfer',
      invoice_receipt_url: '/receipts/bridgestone_tires_quote.pdf',
      description: 'Four All-Weather Heavy-Duty Commercial Tires & High-Speed Balancing (Suburban)',
      status: 'pending'
    },
    {
      id: 5,
      vendor_id: 5, // New York State Thruway / E-ZPass Commercial
      vehicle_id: null,
      rental_id: null,
      recorded_by: 1,
      approver_id: 1,
      category: 'tolls',
      amount: 1450.00,
      expense_date: '2026-11-03',
      payment_method: 'bank_transfer',
      invoice_receipt_url: '/receipts/ezpass_monthly_statement.pdf',
      description: 'MTA Bridges, Tunnels & NY State Thruway Consolidated Commercial Transponder Tolls',
      status: 'paid'
    },
    {
      id: 6,
      vendor_id: 7, // Samsara IoT Telematics
      vehicle_id: null,
      rental_id: null,
      recorded_by: 1,
      approver_id: 1,
      category: 'software',
      amount: 650.00,
      expense_date: '2026-11-02',
      payment_method: 'card',
      invoice_receipt_url: '/receipts/samsara_telematics_nov2026.pdf',
      description: 'Samsara Cloud IoT Telematics, Dashcam AI & Live GPS Tracking Subscriptions',
      status: 'paid'
    },
    {
      id: 7,
      vendor_id: 6, // CleanCar Express Fleet Detailing
      vehicle_id: 2,
      rental_id: 2,
      recorded_by: 1,
      approver_id: 1,
      category: 'cleaning',
      amount: 480.00,
      expense_date: '2026-11-10',
      payment_method: 'cash',
      invoice_receipt_url: '/receipts/cleancar_detailing_fleet.pdf',
      description: 'Bi-weekly Interior Deep Extraction, Ozone Treatment & Exterior Detailing',
      status: 'approved'
    },
    {
      id: 8,
      vendor_id: 8, // Paramount Depot Logistics
      vehicle_id: null,
      rental_id: null,
      recorded_by: 1,
      approver_id: 1,
      category: 'office',
      amount: 3500.00,
      expense_date: '2026-11-01',
      payment_method: 'bank_transfer',
      invoice_receipt_url: '/receipts/depot_yard_lease_nov2026.pdf',
      description: 'Commercial Dispatch Hub Yard & Fleet Staging Facility Monthly Lease',
      status: 'approved'
    }
  ];

  await knex('expenses').insert(expenses);
  console.log('✅ PrimeRoute master accounting data successfully seeded into MySQL!');
};
