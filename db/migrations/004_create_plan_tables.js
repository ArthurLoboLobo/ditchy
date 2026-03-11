/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE plan_drafts (
      id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id UUID      NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      plan_json  JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );

    CREATE INDEX plan_drafts_section_id_idx ON plan_drafts(section_id);

    CREATE TABLE plan_batches (
      id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id  UUID    NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      batch_index INTEGER NOT NULL,
      content     TEXT    NOT NULL
    );

    CREATE INDEX plan_batches_section_id_idx ON plan_batches(section_id);
  `);
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS plan_batches;
    DROP TABLE IF EXISTS plan_drafts;
  `);
};
