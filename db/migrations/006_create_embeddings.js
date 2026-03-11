/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE embeddings (
      id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id  UUID         NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      file_id     UUID         NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      chunk_index INTEGER      NOT NULL,
      chunk_text  TEXT         NOT NULL,
      embedding   VECTOR(1536) NOT NULL,
      created_at  TIMESTAMP    NOT NULL DEFAULT now()
    );

    CREATE INDEX embeddings_section_id_idx ON embeddings(section_id);
    CREATE INDEX embeddings_file_id_idx ON embeddings(file_id);

    -- HNSW index for fast approximate nearest-neighbor vector search (cosine distance)
    CREATE INDEX embeddings_embedding_hnsw_idx ON embeddings
      USING hnsw (embedding vector_cosine_ops);
  `);
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS embeddings;
  `);
};
