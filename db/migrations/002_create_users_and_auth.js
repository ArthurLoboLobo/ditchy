/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE users (
      id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
      email      TEXT      NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );

    CREATE TABLE otp_codes (
      id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code       TEXT      NOT NULL,
      attempts   INTEGER   NOT NULL DEFAULT 0,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );

    CREATE INDEX otp_codes_user_id_idx ON otp_codes(user_id);
  `);
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS otp_codes;
    DROP TABLE IF EXISTS users;
  `);
};
