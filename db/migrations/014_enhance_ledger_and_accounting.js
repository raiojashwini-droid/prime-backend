exports.up = async function (knex) {
  // 1. Enhance ledger_entries table
  await knex.schema.alterTable('ledger_entries', (table) => {
    table.string('category', 100).nullable();
    table.text('description').nullable();
    table.string('status', 50).defaultTo('Posted');
    table.string('qbo_ref', 100).nullable();
    table.string('driver_name', 150).nullable();
    table.string('rental_code', 100).nullable();
    table.json('metadata').nullable();
  });

  // 2. Enhance invoices table
  await knex.schema.alterTable('invoices', (table) => {
    table.bigInteger('driver_id').unsigned().nullable().alter();
    table.string('customer_name', 150).nullable();
    table.string('vehicle_name', 150).nullable();
    table.text('notes').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('invoices', (table) => {
    table.dropColumn('notes');
    table.dropColumn('vehicle_name');
    table.dropColumn('customer_name');
  });

  await knex.schema.alterTable('ledger_entries', (table) => {
    table.dropColumn('metadata');
    table.dropColumn('rental_code');
    table.dropColumn('driver_name');
    table.dropColumn('qbo_ref');
    table.dropColumn('status');
    table.dropColumn('description');
    table.dropColumn('category');
  });
};
