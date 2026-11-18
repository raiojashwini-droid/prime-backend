const db = require('../config/db');

async function main() {
  try {
    await db.raw('ALTER TABLE inspections ADD COLUMN inspection_no VARCHAR(100) NULL AFTER id');
    console.log('Added inspection_no column');
  } catch (e) {
    console.log('inspection_no notice:', e.message);
  }

  try {
    await db.raw("ALTER TABLE inspections ADD COLUMN status VARCHAR(50) DEFAULT 'Passed' AFTER fuel_level");
    console.log('Added status column');
  } catch (e) {
    console.log('status notice:', e.message);
  }

  try {
    await db.raw('ALTER TABLE accidents ADD COLUMN details LONGTEXT NULL AFTER description');
    console.log('Added details column to accidents');
  } catch (e) {
    console.log('accidents details notice:', e.message);
  }

  console.log('Table enhancements complete.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
