exports.up = async function (knex) {
  await knex.schema.alterTable('tolls_tickets', (table) => {
    table.string('location', 255).nullable();
    table.date('received_date').nullable();
    table.decimal('admin_fee', 10, 2).defaultTo(15.00);
    table.decimal('driver_charge', 10, 2).nullable();
    table.decimal('balance', 10, 2).nullable();
    table.string('proof_file_name', 255).nullable();
    table.text('proof_file_url').nullable();
    table.string('proof_file_size', 50).nullable();
    table.string('contract_number', 100).nullable();
    table.boolean('is_toll').notNullable().defaultTo(false);
  });

  // Modify violation_type to VARCHAR(150) so it accepts any custom violation description
  await knex.raw('ALTER TABLE `tolls_tickets` MODIFY `violation_type` VARCHAR(150) NOT NULL DEFAULT "toll"');
};

exports.down = async function (knex) {
  await knex.schema.alterTable('tolls_tickets', (table) => {
    table.dropColumn('is_toll');
    table.dropColumn('contract_number');
    table.dropColumn('proof_file_size');
    table.dropColumn('proof_file_url');
    table.dropColumn('proof_file_name');
    table.dropColumn('balance');
    table.dropColumn('driver_charge');
    table.dropColumn('admin_fee');
    table.dropColumn('received_date');
    table.dropColumn('location');
  });
};
