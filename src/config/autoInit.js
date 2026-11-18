const db = require('./db');
const logger = require('../utils/logger');

async function autoInitDatabase() {
  try {
    logger.info('[AUTO-INIT] Verifying database schema and baseline data...');

    // 1. Ensure columns exist
    try {
      await db.raw('ALTER TABLE inspections ADD COLUMN inspection_no VARCHAR(100) NULL AFTER id');
    } catch (e) {}

    try {
      await db.raw("ALTER TABLE inspections ADD COLUMN status VARCHAR(50) DEFAULT 'Passed' AFTER fuel_level");
    } catch (e) {}

    try {
      await db.raw('ALTER TABLE accidents ADD COLUMN details LONGTEXT NULL AFTER description');
    } catch (e) {}

    try {
      await db.raw('ALTER TABLE employee_paperwork ADD COLUMN form_data LONGTEXT NULL');
    } catch (e) {}

    // 2. Ensure all 6 fleet vehicles exist in database
    const standardVehicles = [
      { id: 1, vin: '1HGCR2F8XNA001001', plate: 'PR-2024-TC', make: 'Toyota', model: 'Camry SE', year: 2024, color: 'Midnight Black', mileage: 24500, status: 'rented', purchase_price: 26320.00 },
      { id: 2, vin: '1HGCR2F8XNA001002', plate: 'PR-2024-HA', make: 'Honda', model: 'Accord Sport', year: 2024, color: 'Platinum White', mileage: 18200, status: 'rented', purchase_price: 27895.00 },
      { id: 3, vin: '5YJ3E1EB8NF001003', plate: 'PR-2024-EV', make: 'Tesla', model: 'Model 3 Long Range', year: 2024, color: 'Deep Blue', mileage: 14300, status: 'rented', purchase_price: 47490.00 },
      { id: 4, vin: '1GNSKBKC8RR001004', plate: 'PR-2024-CS', make: 'Chevrolet', model: 'Suburban Premier', year: 2024, color: 'Shadow Gray', mileage: 38900, status: 'rented', purchase_price: 61200.00 },
      { id: 5, vin: '1FTBR1Y88PKA00105', plate: 'PR-2024-FT', make: 'Ford', model: 'Transit 250 Cargo', year: 2023, color: 'Oxford White', mileage: 32400, status: 'rented', purchase_price: 43500.00 },
      { id: 6, vin: '5NPE24AF8RH001006', plate: 'PR-2024-HS', make: 'Hyundai', model: 'Sonata SEL', year: 2024, color: 'Curated Silver', mileage: 21100, status: 'available', purchase_price: 27500.00 }
    ];

    for (const v of standardVehicles) {
      const exists = await db('vehicles').where({ id: v.id }).first();
      if (!exists) {
        await db('vehicles').insert(v).catch(() => {});
      }
    }

    // 3. Ensure inspections baseline
    const inspCount = await db('inspections').count('id as cnt').first();
    if (Number(inspCount?.cnt || 0) === 0) {
      await db('inspections').insert([
        {
          id: 1,
          inspection_no: 'INSP-8819',
          rental_id: 1,
          vehicle_id: 1,
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
          vehicle_id: 2,
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
          vehicle_id: 3,
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
            spareTirePresent: false,
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
          vehicle_id: 4,
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
      ]).catch(() => {});
    }

    // 4. Ensure accidents baseline
    const accCount = await db('accidents').count('id as cnt').first();
    if (Number(accCount?.cnt || 0) === 0) {
      await db('accidents').insert([
        {
          id: 1,
          vehicle_id: 6,
          driver_id: 3,
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
          vehicle_id: 2,
          driver_id: 2,
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
      ]).catch(() => {});
    }

    // 5. Ensure employee paperwork baseline
    const paperCount = await db('employee_paperwork').count('id as cnt').first().catch(() => null);
    if (Number(paperCount?.cnt || 0) === 0) {
      const firstUser = await db('users').first().catch(() => null);
      const firstDriver = await db('drivers').first().catch(() => null);

      const paperworkPayload = {
        personal: {
          firstName: 'David',
          lastName: 'Miller',
          email: 'david.miller@primeroute.io',
          phone: '+1 (555) 349-1029',
          dob: '1992-06-14',
          address: '742 Evergreen Terrace',
          city: 'Queens',
          state: 'NY',
          zipCode: '11375',
          emergencyContactName: 'Sarah Miller',
          emergencyContactPhone: '+1 (555) 902-4821'
        },
        employment: {
          employeeId: 'PR-EMP-2026',
          position: 'Logistics Fleet Driver',
          department: 'Fleet Operations',
          employmentType: 'Full-Time',
          joiningDate: '2026-03-01',
          assignedManager: 'Elena Vance'
        },
        documents: {
          governmentId: { name: 'US_Passport_DMiller.pdf', size: '2.4 MB', uploadedAt: '2026-11-04' },
          drivingLicense: { name: 'NY_Driver_License_ClassD.pdf', size: '1.8 MB', uploadedAt: '2026-11-04' },
          taxDocuments: { name: 'W4_Signed_2026.pdf', size: '1.1 MB', uploadedAt: '2026-11-04' },
          bankDetails: { name: 'DirectDeposit_VoidCheck.pdf', size: '890 KB', uploadedAt: '2026-11-04' },
          otherDocuments: null
        },
        agreements: {
          codeOfConduct: true,
          safetyPolicy: true,
          digitalSignature: 'David Miller',
          acceptedTerms: true
        }
      };

      await db('employee_paperwork').insert({
        user_id: firstUser?.id || null,
        driver_id: firstDriver?.id || null,
        full_name: 'David Miller',
        ssn_last4: '4829',
        dob: '1992-06-14',
        address: '742 Evergreen Terrace, Queens, NY 11375',
        phone: '+1 (555) 349-1029',
        emergency_contact: JSON.stringify({ name: 'Sarah Miller', phone: '+1 (555) 902-4821', relation: 'Spouse' }),
        direct_deposit_details: JSON.stringify({ bank: 'Chase Commercial', routing: '••••4812', account: '••••••••8819' }),
        status: 'submitted',
        submitted_at: '2026-11-12 10:30:00',
        reviewed_by: null,
        review_notes: 'Under review by Operations Director Elena Vance.',
        signature_url: 'David Miller',
        form_data: JSON.stringify(paperworkPayload),
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      }).catch((e) => logger.warn(`[AUTO-INIT] Paperwork init note: ${e.message}`));
    }

    logger.info('[AUTO-INIT] Baseline data verification completed successfully.');
  } catch (err) {
    logger.warn(`[AUTO-INIT NOTICE] Non-fatal auto-init note: ${err.message}`);
  }
}

module.exports = autoInitDatabase;
