/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS vector;');
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.sql('DROP EXTENSION IF EXISTS vector;');
};
