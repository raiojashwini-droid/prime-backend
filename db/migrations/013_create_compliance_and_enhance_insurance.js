exports.up = async function (knex) {
  // 1. Enhance insurance_policies table
  await knex.schema.alterTable('insurance_policies', (table) => {
    table.text('coverage_details').nullable();
    table.string('vehicles_covered', 150).nullable();
    table.json('contacts').nullable();
    table.json('documents').nullable();
  });

  // 2. Enhance insurance_claims table
  await knex.schema.alterTable('insurance_claims', (table) => {
    table.string('accident_ref', 100).nullable();
    table.string('policy_number', 100).nullable();
    table.string('insurer', 150).nullable();
    table.string('vehicle', 150).nullable();
    table.string('plate', 50).nullable();
    table.string('driver', 150).nullable();
    table.string('repair_invoice', 150).nullable();
    table.string('repair_invoice_file', 255).nullable();
    table.decimal('repair_estimate', 12, 2).nullable();
    table.string('deductible_terms', 150).nullable();
    table.decimal('driver_charge', 12, 2).nullable().defaultTo(0.00);
    table.decimal('driver_recovered', 12, 2).nullable().defaultTo(0.00);
    table.decimal('amount_recovered', 12, 2).nullable().defaultTo(0.00);
    table.string('adjuster_name', 150).nullable();
    table.string('adjuster_phone', 100).nullable();
  });

  // Make policy_id and vehicle_id nullable in insurance_claims
  await knex.schema.alterTable('insurance_claims', (table) => {
    table.bigInteger('policy_id').unsigned().nullable().alter();
    table.bigInteger('vehicle_id').unsigned().nullable().alter();
  });

  // 3. Create compliance_records table
  await knex.schema.createTable('compliance_records', (table) => {
    table.engine('InnoDB');
    table.charset('utf8mb4');
    table.bigIncrements('id').primary();
    table.string('category', 100).notNullable();
    table.string('title', 255).notNullable();
    table.string('entity_type', 50).notNullable();
    table.string('entity_name', 255).notNullable();
    table.string('entity_id', 100).nullable();
    table.string('identifier', 100).nullable();
    table.string('authority', 255).notNullable();
    table.date('expiry_date').notNullable();
    table.string('document_file', 255).nullable();
    table.string('status', 50).notNullable();
    table.text('notes').nullable();
    table.timestamps(true, true);

    table.index(['category']);
    table.index(['expiry_date']);
    table.index(['status']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('compliance_records');

  await knex.schema.alterTable('insurance_claims', (table) => {
    table.dropColumn('accident_ref');
    table.dropColumn('policy_number');
    table.dropColumn('insurer');
    table.dropColumn('vehicle');
    table.dropColumn('plate');
    table.dropColumn('driver');
    table.dropColumn('repair_invoice');
    table.dropColumn('repair_invoice_file');
    table.dropColumn('repair_estimate');
    table.dropColumn('deductible_terms');
    table.dropColumn('driver_charge');
    table.dropColumn('driver_recovered');
    table.dropColumn('amount_recovered');
    table.dropColumn('adjuster_name');
    table.dropColumn('adjuster_phone');
  });

  await knex.schema.alterTable('insurance_policies', (table) => {
    table.dropColumn('coverage_details');
    table.dropColumn('vehicles_covered');
    table.dropColumn('contacts');
    table.dropColumn('documents');
  });
};
