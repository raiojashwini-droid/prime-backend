exports.seed = async function (knex) {
  // Only insert sample data when NODE_ENV is development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  await knex('insurance_claims').truncate();
  await knex('insurance_policies').truncate();
  await knex('compliance_records').truncate();
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');

  // 1. Seed Insurance Policies
  const policies = [
    {
      id: 1,
      policy_number: 'TRV-CA-9821034-25',
      insurer_name: 'Travelers Commercial Auto & Marine',
      coverage_type: 'Full Comprehensive & $1M CSL Liability',
      premium: 34200.00,
      deductible: 1000.00,
      effective_date: '2025-01-01',
      expiry_date: '2026-01-01',
      status: 'active',
      coverage_details: '$1,000,000 Combined Single Limit (CSL) Auto Liability, Comprehensive & Collision, Uninsured/Underinsured Motorist',
      vehicles_covered: '65',
      contacts: JSON.stringify({
        agentName: 'Arthur Pendelton (Senior Commercial Underwriter)',
        phone: '+1 (800) 555-8728 ext. 402',
        email: 'commercial.claims@travelers.com',
        broker: 'Aon Risk Solutions NYC'
      }),
      documents: JSON.stringify([
        { name: 'Travelers_Master_Fleet_Policy_2025.pdf', size: '4.8 MB', uploadDate: '2025-01-02' },
        { name: 'Certificate_of_Liability_Insurance_COI.pdf', size: '1.1 MB', uploadDate: '2025-01-05' }
      ])
    },
    {
      id: 2,
      policy_number: 'PRG-FLEET-449120',
      insurer_name: 'Progressive Commercial Fleet',
      coverage_type: '$5M Excess Umbrella & Towing',
      premium: 14400.00,
      deductible: 500.00,
      effective_date: '2025-03-01',
      expiry_date: '2026-03-01',
      status: 'active',
      coverage_details: '$5,000,000 Commercial Excess Umbrella Liability, 24/7 Fleet Roadside Breakdown & Heavy Towing Assistance',
      vehicles_covered: '65',
      contacts: JSON.stringify({
        agentName: 'Brenda Vance (Fleet Accounts Specialist)',
        phone: '+1 (888) 240-8692',
        email: 'commercialhelp@progressive.com',
        broker: 'Marsh McLennan Agency'
      }),
      documents: JSON.stringify([
        { name: 'Progressive_Excess_Umbrella_Certificate.pdf', size: '2.3 MB', uploadDate: '2025-03-02' }
      ])
    },
    {
      id: 3,
      policy_number: 'NAT-GEN-773190-25',
      insurer_name: 'National General Fleet Assurance',
      coverage_type: 'State Minimum Legal & GAP Protection',
      premium: 9600.00,
      deductible: 1500.00,
      effective_date: '2024-08-15',
      expiry_date: '2025-08-15',
      status: 'active',
      coverage_details: 'Contingent Liability, Physical Damage GAP Protection & Regulatory State Filings',
      vehicles_covered: '30',
      contacts: JSON.stringify({
        agentName: 'Donald Mitchell',
        phone: '+1 (800) 462-2123',
        email: 'fleetunderwriting@natgen.com',
        broker: 'Hub International'
      }),
      documents: JSON.stringify([
        { name: 'NatGen_GAP_Endorsement_Schedule.pdf', size: '1.7 MB', uploadDate: '2024-08-16' }
      ])
    }
  ];

  await knex('insurance_policies').insert(policies);

  // 2. Ensure sample accidents exist if empty
  const accidentCount = await knex('accidents').count('id as cnt').first();
  if (!accidentCount || Number(accidentCount.cnt) === 0) {
    // Check if vehicle exists
    const v = await knex('vehicles').first();
    const vId = v ? v.id : 1;
    await knex('accidents').insert([
      {
        id: 1,
        vehicle_id: vId,
        accident_date: '2025-06-22 14:30:00',
        location: 'I-95 South Exit 42, Newark NJ',
        description: 'Low-speed rear-end collision in stop-and-go traffic. Rear bumper dented and trunk lid misaligned.',
        police_report_no: 'NJSP-2025-99812',
        estimated_damage: 1450.00,
        status: 'resolved'
      },
      {
        id: 2,
        vehicle_id: vId,
        accident_date: '2025-07-11 09:15:00',
        location: 'Route 1 & Grand Ave Intersection, Queens NY',
        description: 'Front passenger quarter panel struck by delivery van turning into commercial loading bay.',
        police_report_no: 'NYPD-112-2025-4819',
        estimated_damage: 2800.00,
        status: 'under_investigation'
      },
      {
        id: 3,
        vehicle_id: vId,
        accident_date: '2025-07-04 22:40:00',
        location: 'Parking Garage Level 2, JFK Airport Queens NY',
        description: 'Parked vehicle side-swiped by unknown vehicle. Driver door scratched and mirror assembly sheared off.',
        police_report_no: 'PAPD-JFK-2025-0914',
        estimated_damage: 1250.00,
        status: 'under_investigation'
      }
    ]);
  }

  // 3. Seed Insurance Claims
  const claims = [
    {
      id: 1,
      policy_id: 1,
      accident_id: 1,
      vehicle_id: 1,
      claim_number: 'CLM-TRV-882190',
      claim_date: '2025-06-22',
      claim_amount: 1450.00,
      payout_amount: 950.00,
      deductible_applied: 500.00,
      status: 'settled',
      notes: 'Subrogation closed. Carrier disbursed $950 directly to Speedy Pro Auto Clinic; driver deductible $500 collected from deposit escrow.',
      accident_ref: 'ACC-2025-012',
      policy_number: 'TRV-CA-9821034-25',
      insurer: 'Travelers Commercial Auto & Marine',
      vehicle: 'Hyundai Sonata SEL',
      plate: 'PR-2024-HS',
      driver: 'Sarah Jenkins',
      repair_invoice: 'INV-SHOP-8819 ($1,450)',
      repair_invoice_file: 'speedy_pro_invoice_1450.pdf',
      repair_estimate: 1450.00,
      deductible_terms: '$500 Collision Deductible',
      driver_charge: 500.00,
      driver_recovered: 500.00,
      amount_recovered: 1450.00,
      adjuster_name: 'Mark Rosenthal',
      adjuster_phone: '+1 (800) 555-8728 ext. 109'
    },
    {
      id: 2,
      policy_id: 1,
      accident_id: 2,
      vehicle_id: 1,
      claim_number: 'CLM-TRV-882204',
      claim_date: '2025-07-11',
      claim_amount: 2800.00,
      payout_amount: 0.00,
      deductible_applied: 1000.00,
      status: 'under_review',
      notes: 'Adjuster physical inspection completed at Apex Collision Center; awaiting formal approval and estimate authorization.',
      accident_ref: 'ACC-2025-014',
      policy_number: 'TRV-CA-9821034-25',
      insurer: 'Travelers Commercial Auto & Marine',
      vehicle: 'Honda Civic EX',
      plate: 'PR-2024-HC',
      driver: 'Carlos Mendez',
      repair_invoice: 'INV-SHOP-8944 ($2,750)',
      repair_invoice_file: 'apex_collision_estimate_inv.pdf',
      repair_estimate: 2800.00,
      deductible_terms: '$1,000 Collision Deductible',
      driver_charge: 1000.00,
      driver_recovered: 250.00,
      amount_recovered: 250.00,
      adjuster_name: 'Jessica Taylor (Field Adjuster)',
      adjuster_phone: '+1 (800) 555-8728 ext. 235'
    },
    {
      id: 3,
      policy_id: 2,
      accident_id: 3,
      vehicle_id: 1,
      claim_number: 'CLM-PRG-339102',
      claim_date: '2025-07-05',
      claim_amount: 1250.00,
      payout_amount: 0.00,
      deductible_applied: 500.00,
      status: 'submitted',
      notes: 'Port Authority police report filed. PAPD security camera footage requested for hit-and-run subrogation.',
      accident_ref: 'ACC-2025-013',
      policy_number: 'PRG-FLEET-449120',
      insurer: 'Progressive Commercial Fleet',
      vehicle: 'Toyota Camry SE',
      plate: 'PR-2024-TC',
      driver: 'Marcus Vance',
      repair_invoice: 'Pending Estimate',
      repair_invoice_file: '',
      repair_estimate: 1250.00,
      deductible_terms: '$500 Comprehensive Deductible',
      driver_charge: 500.00,
      driver_recovered: 0.00,
      amount_recovered: 0.00,
      adjuster_name: 'Unassigned (Desk Queue)',
      adjuster_phone: '+1 (888) 240-8692'
    }
  ];

  await knex('insurance_claims').insert(claims);

  // 4. Seed Compliance Records (calculated relative to today to ensure live countdown accuracy)
  const now = new Date();
  const addDays = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const compliance = [
    {
      id: 1,
      category: 'Vehicle Registration',
      title: 'NY DMV Commercial Vehicle Registration',
      entity_type: 'Vehicle',
      entity_name: 'Toyota Camry SE (PR-2024-TC)',
      entity_id: 'VEH-001',
      identifier: 'REG-NY-991204',
      authority: 'New York State DMV',
      expiry_date: addDays(5),
      document_file: 'ny_dmv_camry_reg.pdf',
      status: 'Critical (≤7 days)',
      notes: 'State inspection decal and registration renewal submitted online; pending sticker dispatch.'
    },
    {
      id: 2,
      category: 'Vehicle Registration',
      title: 'NJ MVC Commercial Fleet Registration',
      entity_type: 'Vehicle',
      entity_name: 'Honda Accord Sport (PR-2024-HA)',
      entity_id: 'VEH-002',
      identifier: 'REG-NJ-449102',
      authority: 'NJ Motor Vehicle Commission',
      expiry_date: addDays(12),
      document_file: 'nj_mvc_accord_reg.pdf',
      status: 'Expiring Soon (≤14 days)',
      notes: 'Annual commercial registration renewal invoice received; queued for payment.'
    },
    {
      id: 3,
      category: 'Vehicle Registration',
      title: 'CA DMV Fleet Commercial Decal',
      entity_type: 'Vehicle',
      entity_name: 'Tesla Model 3 (PR-2024-TM)',
      entity_id: 'VEH-005',
      identifier: 'REG-CA-882190',
      authority: 'California DMV Commercial Services',
      expiry_date: addDays(25),
      document_file: 'ca_dmv_tesla_reg.pdf',
      status: 'Upcoming (≤30 days)',
      notes: 'Zero emissions fleet registration certificate active.'
    },
    {
      id: 4,
      category: 'Vehicle Registration',
      title: 'TX DMV Heavy Fleet Registration',
      entity_type: 'Vehicle',
      entity_name: 'Chevrolet Suburban (PR-2024-CS)',
      entity_id: 'VEH-007',
      identifier: 'REG-TX-774012',
      authority: 'Texas DMV Fleet Division',
      expiry_date: addDays(218),
      document_file: 'tx_dmv_suburban_reg.pdf',
      status: 'Compliant (>30 days)',
      notes: 'Multi-year fleet registration valid.'
    },
    {
      id: 5,
      category: 'Driver License',
      title: 'Commercial Driver License (CDL Class A)',
      entity_type: 'Driver',
      entity_name: 'Marcus Vance',
      entity_id: 'DRV-101',
      identifier: 'DL-NY-849201948',
      authority: 'NYS Department of Motor Vehicles',
      expiry_date: addDays(6),
      document_file: 'marcus_vance_cdl_renewal.pdf',
      status: 'Critical (≤7 days)',
      notes: 'CDL Medical Examiner Certificate updated; vision test and in-person DMV appointment booked.'
    },
    {
      id: 6,
      category: 'Driver License',
      title: 'Commercial Chauffeur License (CDL Class B)',
      entity_type: 'Driver',
      entity_name: 'Sarah Jenkins',
      entity_id: 'DRV-103',
      identifier: 'DL-NJ-339102941',
      authority: 'NJ Motor Vehicle Commission',
      expiry_date: addDays(13),
      document_file: 'sarah_jenkins_cdl.pdf',
      status: 'Expiring Soon (≤14 days)',
      notes: 'Passenger endorsement active; background verification completed.'
    },
    {
      id: 7,
      category: 'Driver License',
      title: 'Standard Operator Driver License (Class D)',
      entity_type: 'Driver',
      entity_name: 'David Miller',
      entity_id: 'DRV-102',
      identifier: 'DL-NY-294018241',
      authority: 'NYS Department of Motor Vehicles',
      expiry_date: addDays(28),
      document_file: 'david_miller_dl_verified.pdf',
      status: 'Upcoming (≤30 days)',
      notes: 'Standard renewal processed online; digital temp card on file.'
    },
    {
      id: 8,
      category: 'Rental Contract',
      title: 'Long-Term Corporate Fleet Rental Agreement',
      entity_type: 'Rental Agreement',
      entity_name: 'Apex Logistics LLC / Marcus Vance',
      entity_id: 'RNT-2025-081',
      identifier: 'CTR-APX-884102',
      authority: 'PrimeRoute Fleet Legal & Compliance',
      expiry_date: addDays(7),
      document_file: 'apex_corporate_master_contract.pdf',
      status: 'Critical (≤7 days)',
      notes: '48-week master fleet lease agreement expiring; contract extension amendment drafted and sent via DocuSign.'
    },
    {
      id: 9,
      category: 'Required Document',
      title: 'DOT Commercial Fleet Annual Safety Inspection Certificate',
      entity_type: 'Fleet',
      entity_name: 'NY State Heavy Vehicle Safety Program',
      entity_id: 'FLT-DOC-001',
      identifier: 'DOT-NY-2024-99182',
      authority: 'US Department of Transportation (USDOT / FMCSA)',
      expiry_date: addDays(4),
      document_file: 'dot_annual_safety_audit_cert.pdf',
      status: 'Critical (≤7 days)',
      notes: 'Mandatory annual fleet safety review by certified state inspector; on-site inspection scheduled at Main Yard.'
    }
  ];

  await knex('compliance_records').insert(compliance);
};
