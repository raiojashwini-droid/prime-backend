const db = require('../config/db');

async function seed() {
  console.log('Seeding Inspections, Accidents, and Employee Paperwork...');

  // 1. Seed Inspections
  await db('inspections').del();

  const inspectionRows = [
    {
      id: 1,
      inspection_no: 'INSP-8819',
      rental_id: 1,
      vehicle_id: 1, // Toyota Camry SE (PR-2024-TC)
      inspector_id: 1,
      inspection_type: 'pickup',
      inspection_date: '2026-11-01 09:30:00',
      odometer: 24500,
      fuel_level: '100%',
      status: 'Passed',
      condition_checklist: JSON.stringify({
        exteriorCondition: 'Pristine / Clean',
        interiorCondition: 'Clean & Sanitized',
        tiresCondition: 'Good (8/32")',
        windshieldStatus: 'Clear / No Cracks',
        spareTirePresent: true,
        damageClassification: 'No Damage',
        existingDamage: 'Minor 0.5-inch stone chip on lower front bumper (baseline recorded).',
        newDamage: 'None.'
      }),
      notes: 'Initial check-out for monthly rental contract. All systems optimal.',
      driver_acknowledged: 1,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    },
    {
      id: 2,
      inspection_no: 'INSP-8820',
      rental_id: 2,
      vehicle_id: 2, // Honda Accord Sport (PR-2024-HA)
      inspector_id: 1,
      inspection_type: 'routine',
      inspection_date: '2026-11-05 14:15:00',
      odometer: 18200,
      fuel_level: '75%',
      status: 'Passed',
      condition_checklist: JSON.stringify({
        exteriorCondition: 'Good / Light Dust',
        interiorCondition: 'Clean',
        tiresCondition: 'Good (7/32")',
        windshieldStatus: 'Clear / No Cracks',
        spareTirePresent: true,
        damageClassification: 'No Damage',
        existingDamage: 'None',
        newDamage: 'None'
      }),
      notes: 'Routine 30-day fleet audit. Tire pressures calibrated to 34 PSI.',
      driver_acknowledged: 1,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    },
    {
      id: 3,
      inspection_no: 'INSP-8821',
      rental_id: 3,
      vehicle_id: 3, // Tesla Model 3 Long Range (PR-2024-EV)
      inspector_id: 1,
      inspection_type: 'pickup',
      inspection_date: '2026-11-10 11:00:00',
      odometer: 14300,
      fuel_level: '90%',
      status: 'Passed',
      condition_checklist: JSON.stringify({
        exteriorCondition: 'Pristine',
        interiorCondition: 'Excellent',
        tiresCondition: 'Good (8/32")',
        windshieldStatus: 'Clear',
        spareTirePresent: false, // Tesla tire kit verified
        damageClassification: 'No Damage',
        existingDamage: 'None',
        newDamage: 'None'
      }),
      notes: 'EV battery state-of-charge 90%. Mobile charger pack and J1772 adapter verified in trunk.',
      driver_acknowledged: 1,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    },
    {
      id: 4,
      inspection_no: 'INSP-8822',
      rental_id: 4,
      vehicle_id: 4, // Chevrolet Suburban Premier (PR-2024-CS)
      inspector_id: 1,
      inspection_type: 'return',
      inspection_date: '2026-11-14 16:45:00',
      odometer: 38900,
      fuel_level: '50%',
      status: 'Flagged',
      condition_checklist: JSON.stringify({
        exteriorCondition: 'Scratched Rear Bumper',
        interiorCondition: 'Moderate Wear',
        tiresCondition: 'Good (6/32")',
        windshieldStatus: 'Minor surface wiper streak',
        spareTirePresent: true,
        damageClassification: 'Minor Damage',
        existingDamage: 'Small rub mark on rear right quarter panel.',
        newDamage: 'Surface clear-coat scuff on rear bumper fascia (~3 inches).'
      }),
      notes: 'Return intake inspection. Scheduled for workshop review and transmission flush.',
      driver_acknowledged: 1,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    }
  ];

  await db('inspections').insert(inspectionRows);
  console.log(`✓ Seeded ${inspectionRows.length} inspections`);

  // 2. Seed Accidents
  await db('accidents').del();

  const accidentRows = [
    {
      id: 1,
      vehicle_id: 6, // Hyundai Sonata SEL (PR-2024-HS)
      driver_id: 3,  // Sarah Jenkins
      rental_id: 1,
      accident_date: '2026-10-22 17:30:00',
      location: 'I-95 South Exit 42, Newark NJ',
      description: 'Low-speed rear-end collision in stop-and-go traffic. Rear bumper dented and trunk lid misaligned.',
      police_report_no: 'NJSP-2026-99812',
      estimated_damage: 1450.00,
      status: 'under_investigation',
      details: JSON.stringify({
        thirdPartyInfo: '2021 Ford Escape (Plate: NJ-882-KLB)',
        repairEstimate: 1450,
        repairInvoiceNumber: 'INV-SHOP-8819',
        repairInvoiceAmount: 1450,
        repairInvoiceFile: 'speedy_pro_invoice_1450.pdf',
        insuranceCarrier: 'Travelers Commercial Auto',
        claimNumber: 'CLM-TRV-882190',
        linkedPolicyId: 'POL-TRV-101',
        deductibleTerms: '$500 Driver Deductible / Collision Terms',
        deductibleAmount: 500,
        driverLiabilityStatus: 'Driver Liable - Deductible Due',
        driverChargeStatus: 'Invoice Sent ($500)',
        driverInvoiceNumber: 'INV-DRV-9912',
        driverPaymentStatus: 'Unpaid / Pending Deductible Collection'
      }),
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    },
    {
      id: 2,
      vehicle_id: 2, // Honda Accord Sport (PR-2024-HA)
      driver_id: 2,  // David Miller
      rental_id: 2,
      accident_date: '2026-11-02 08:45:00',
      location: 'Route 1 & 9, Jersey City NJ',
      description: 'Side mirror swipe by a delivery cyclist in heavy morning congestion.',
      police_report_no: 'JCPD-2026-44102',
      estimated_damage: 320.00,
      status: 'repair_pending',
      details: JSON.stringify({
        thirdPartyInfo: 'Commercial bicycle courier',
        repairEstimate: 320,
        repairInvoiceNumber: 'INV-SHOP-8840',
        repairInvoiceAmount: 320,
        repairInvoiceFile: 'metro_glass_mirror_320.pdf',
        insuranceCarrier: 'PrimeRoute Fleet Self-Insured Reserve',
        claimNumber: 'CLM-INT-1029',
        linkedPolicyId: 'POL-FLT-202',
        deductibleTerms: 'Minor Damage Threshold Under Deductible',
        deductibleAmount: 0,
        driverLiabilityStatus: 'No Fault / Under Waiver',
        driverChargeStatus: 'Waived Under Fleet Care',
        driverInvoiceNumber: 'N/A',
        driverPaymentStatus: 'Cleared'
      }),
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    }
  ];

  await db('accidents').insert(accidentRows);
  console.log(`✓ Seeded ${accidentRows.length} accidents`);

  // 3. Seed Employee Paperwork
  await db('employee_paperwork').del();

  const paperworkPayload = {
    personal: {
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.miller@primeroute.io',
      phone: '+1 (555) 349-1029',
      dob: '1992-06-14',
      address: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      zip: '97477',
      ssnLast4: '4829',
      emergencyName: 'Sarah Miller',
      emergencyPhone: '+1 (555) 981-2231',
      emergencyRelation: 'Spouse'
    },
    employment: {
      position: 'Fleet Technician & Detailer',
      department: 'Operations',
      startDate: '2024-03-15',
      manager: 'Marcus Brody',
      employmentType: 'Full-Time',
      bankName: 'Chase Commercial',
      routingNumber: '••••4812',
      accountNumber: '••••••••8819',
      taxStatus: 'W-4 Single (1 Allowance)'
    },
    documents: {
      driversLicense: { name: 'DL_DavidMiller_2026.pdf', size: '2.4 MB', uploadedAt: '2024-03-12' },
      w4Form: { name: 'W4_Signed_2024.pdf', size: '1.1 MB', uploadedAt: '2024-03-14' },
      i9Verification: { name: 'I9_Verification_Miller.pdf', size: '3.8 MB', uploadedAt: '2024-03-14' },
      directDepositVoidCheck: { name: 'VoidCheck_Chase.pdf', size: '890 KB', uploadedAt: '2024-03-13' }
    },
    agreements: {
      handbookAcknowledged: true,
      confidentialitySigned: true,
      safetyPolicyAgreed: true,
      directDepositConsent: true,
      electronicSignature: 'David Miller',
      signedDate: '2024-03-14'
    }
  };

  const paperworkRows = [
    {
      id: 1,
      user_id: 1,
      driver_id: 2,
      full_name: 'David Miller',
      ssn_last4: '4829',
      dob: '1992-06-14',
      address: '742 Evergreen Terrace, Springfield, OR 97477',
      phone: '+1 (555) 349-1029',
      emergency_contact: JSON.stringify({ name: 'Sarah Miller', phone: '+1 (555) 981-2231', relation: 'Spouse' }),
      direct_deposit_details: JSON.stringify({ bank: 'Chase Commercial', routing: '••••4812', account: '••••••••8819' }),
      status: 'submitted',
      submitted_at: '2026-11-12 10:30:00',
      reviewed_by: null,
      review_notes: 'Under review by Operations Director Elena Vance.',
      signature_url: 'David Miller',
      form_data: JSON.stringify(paperworkPayload),
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    }
  ];

  await db('employee_paperwork').insert(paperworkRows);
  console.log(`✓ Seeded ${paperworkRows.length} employee paperwork records`);

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
