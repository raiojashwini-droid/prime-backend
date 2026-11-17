const db = require('../config/db');

async function seedTollsAndViolations() {
  console.log('Seeding violations and tolls into MySQL...');

  await db('tolls_tickets').del();

  const citations = [
    {
      id: 1,
      violation_number: 'NYC-PARK-881923',
      issuing_authority: 'NYC Department of Finance (DOF)',
      vehicle_id: 6, // Hyundai Sonata SEL (PR-2024-HS)
      driver_id: 3,  // Sarah Jenkins
      rental_id: 4,
      contract_number: 'RNT-2024-082',
      violation_type: 'Parking Violation (Street Sweeping / No Standing)',
      location: '45th St & 7th Ave, Manhattan',
      amount: 75.00,
      admin_fee: 15.00,
      driver_charge: 90.00,
      balance: 90.00,
      violation_date: '2026-10-14 11:30:00',
      received_date: '2026-10-18',
      due_date: '2026-11-04',
      status: 'assigned',
      driver_charged: 0,
      proof_file_name: 'notice_nyc_881923.pdf',
      notes: 'Double parked during delivery drop.',
      is_toll: 0
    },
    {
      id: 2,
      violation_number: 'NJ-SPEED-201948',
      issuing_authority: 'NJ Turnpike & Garden State Pkwy',
      vehicle_id: 4, // Chevrolet Suburban Premier (PR-2024-CS)
      driver_id: 1,  // Marcus Vance
      rental_id: 1,
      contract_number: 'RNT-2024-089',
      violation_type: 'Speed Camera Infraction',
      location: 'Garden State Pkwy Mile 132',
      amount: 110.00,
      admin_fee: 15.00,
      driver_charge: 125.00,
      balance: 0.00,
      violation_date: '2026-09-28 14:15:00',
      received_date: '2026-10-02',
      due_date: '2026-10-15',
      status: 'paid',
      driver_charged: 1,
      proof_file_name: 'nj_turnpike_receipt.pdf',
      notes: 'Settled via auto-pay portal and deducted from driver balance.',
      is_toll: 0
    },
    {
      id: 3,
      violation_number: 'MIA-BUS-109283',
      issuing_authority: 'Miami-Dade County Traffic Bureau',
      vehicle_id: 2, // Honda Accord Sport (PR-2024-HA)
      driver_id: 5,  // Elena Rostova
      rental_id: 2,
      contract_number: 'RNT-2024-090',
      violation_type: 'Bus Lane / Transit Lane Infraction',
      location: 'Biscayne Blvd, Miami',
      amount: 150.00,
      admin_fee: 20.00,
      driver_charge: 170.00,
      balance: 170.00,
      violation_date: '2026-09-15 16:45:00',
      received_date: '2026-09-20',
      due_date: '2026-10-05',
      status: 'charged',
      driver_charged: 1,
      proof_file_name: 'miami_bus_citation.pdf',
      notes: 'Dispute filed; settled and charged to driver contract.',
      is_toll: 0
    },
    {
      id: 4,
      violation_number: 'PANYNJ-TOLL-99120',
      issuing_authority: 'Port Authority of NY & NJ',
      vehicle_id: 1, // Toyota Camry SE (PR-2024-TC)
      driver_id: null,
      rental_id: null,
      contract_number: 'N/A',
      violation_type: 'Toll Evasion / Video Toll Surcharge',
      location: 'George Washington Bridge Upper Level',
      amount: 105.00,
      admin_fee: 15.00,
      driver_charge: 120.00,
      balance: 120.00,
      violation_date: '2026-10-09 09:20:00',
      received_date: '2026-10-12',
      due_date: '2026-10-30',
      status: 'under_review',
      driver_charged: 0,
      proof_file_name: 'gwb_toll_violation.pdf',
      notes: 'Vehicle was returning from scheduled detailing; reviewing dispatch logs.',
      is_toll: 0
    },
    {
      id: 5,
      violation_number: 'CHI-RED-440192',
      issuing_authority: 'City of Chicago Dept of Finance',
      vehicle_id: 3, // Tesla Model 3 Long Range (PR-2024-EV)
      driver_id: 4,  // Alexander Reed
      rental_id: 3,
      contract_number: 'RNT-2024-091',
      violation_type: 'Red Light Camera Infraction',
      location: 'Michigan Ave & Wacker Dr',
      amount: 100.00,
      admin_fee: 15.00,
      driver_charge: 115.00,
      balance: 115.00,
      violation_date: '2026-10-02 18:30:00',
      received_date: '2026-10-06',
      due_date: '2026-10-10',
      status: 'disputed',
      driver_charged: 0,
      proof_file_name: 'chicago_redlight.pdf',
      notes: 'Driver claims emergency vehicle forced right turn; submitted appeal.',
      is_toll: 0
    }
  ];

  const electronicTolls = [
    {
      id: 6,
      violation_number: 'TOL-501',
      issuing_authority: 'MTA Bridges & Tunnels / E-ZPass',
      vehicle_id: 1, // Toyota Camry SE
      driver_id: 1,
      rental_id: 1,
      contract_number: 'RNT-2024-089',
      violation_type: 'Electronic Toll Tag',
      location: 'Lincoln Tunnel Toll Plaza',
      amount: 16.00,
      admin_fee: 0.00,
      driver_charge: 16.00,
      balance: 0.00,
      violation_date: '2026-11-10 08:42:00',
      received_date: '2026-11-10',
      due_date: null,
      status: 'paid',
      driver_charged: 1,
      proof_file_name: null,
      notes: 'Auto-replenishment transponder debit.',
      is_toll: 1
    },
    {
      id: 7,
      violation_number: 'TOL-502',
      issuing_authority: 'TxDOT Express Lanes',
      vehicle_id: 3, // Tesla Model 3
      driver_id: 4,
      rental_id: 3,
      contract_number: 'RNT-2024-091',
      violation_type: 'Electronic Toll Tag',
      location: 'MoPac Express Lane, Austin',
      amount: 6.50,
      admin_fee: 0.00,
      driver_charge: 6.50,
      balance: 0.00,
      violation_date: '2026-11-09 17:15:00',
      received_date: '2026-11-09',
      due_date: null,
      status: 'paid',
      driver_charged: 1,
      proof_file_name: null,
      notes: 'Auto-replenishment transponder debit.',
      is_toll: 1
    },
    {
      id: 8,
      violation_number: 'TOL-503',
      issuing_authority: 'Port Authority of NY & NJ',
      vehicle_id: 5, // Ford Transit 250 Cargo
      driver_id: 5,
      rental_id: 5,
      contract_number: 'RNT-2024-093',
      violation_type: 'Electronic Toll Tag',
      location: 'George Washington Bridge Upper Level',
      amount: 17.50,
      admin_fee: 0.00,
      driver_charge: 17.50,
      balance: 0.00,
      violation_date: '2026-11-08 11:20:00',
      received_date: '2026-11-08',
      due_date: null,
      status: 'paid',
      driver_charged: 1,
      proof_file_name: null,
      notes: 'Commercial multi-axle bridge toll pass.',
      is_toll: 1
    },
    {
      id: 9,
      violation_number: 'TOL-504',
      issuing_authority: 'Bay Area Toll Authority (FasTrak)',
      vehicle_id: 2, // Honda Accord Sport
      driver_id: 2,
      rental_id: 2,
      contract_number: 'RNT-2024-090',
      violation_type: 'Electronic Toll Tag',
      location: 'San Francisco Bay Bridge Plaza',
      amount: 7.00,
      admin_fee: 0.00,
      driver_charge: 7.00,
      balance: 0.00,
      violation_date: '2026-11-07 09:30:00',
      received_date: '2026-11-07',
      due_date: null,
      status: 'paid',
      driver_charged: 1,
      proof_file_name: null,
      notes: 'Morning peak westbound automated scan.',
      is_toll: 1
    }
  ];

  await db('tolls_tickets').insert([...citations, ...electronicTolls]);
  console.log('✓ 5 Municipal Citations & 4 Electronic Tolls successfully seeded into MySQL!');
}

seedTollsAndViolations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error seeding tolls:', err);
    process.exit(1);
  });
