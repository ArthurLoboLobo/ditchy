/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE ai_call_logs (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      label         TEXT        NOT NULL,
      model         TEXT        NOT NULL,
      input_tokens  INTEGER,
      output_tokens INTEGER,
      input_text    TEXT,
      output_text   TEXT,
      user_id       UUID,
      section_id    UUID,
      duration_ms   INTEGER     NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX ai_call_logs_created_at_idx ON ai_call_logs(created_at);
  `);
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS ai_call_logs;`);
};
