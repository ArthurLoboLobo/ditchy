/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE topics (
      id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id   UUID      NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      title        TEXT      NOT NULL,
      "order"      INTEGER   NOT NULL,
      is_completed BOOLEAN   NOT NULL DEFAULT false,
      created_at   TIMESTAMP NOT NULL DEFAULT now()
    );

    CREATE INDEX topics_section_id_idx ON topics(section_id);

    CREATE TABLE subtopics (
      id       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
      topic_id UUID    NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      text     TEXT    NOT NULL,
      "order"  INTEGER NOT NULL
    );

    CREATE INDEX subtopics_topic_id_idx ON subtopics(topic_id);

    CREATE TABLE chats (
      id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id UUID      NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      topic_id   UUID      REFERENCES topics(id) ON DELETE CASCADE,
      type       TEXT      NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );

    CREATE INDEX chats_section_id_idx ON chats(section_id);
    CREATE INDEX chats_topic_id_idx ON chats(topic_id);

    CREATE TABLE messages (
      id         SERIAL    PRIMARY KEY,
      chat_id    UUID      NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role       TEXT      NOT NULL,
      content    TEXT      NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );

    CREATE INDEX messages_chat_id_idx ON messages(chat_id);

    CREATE TABLE chat_summaries (
      id                          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
      chat_id                     UUID      NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      summary_text                TEXT      NOT NULL,
      summarized_up_to_message_id INTEGER   REFERENCES messages(id),
      created_at                  TIMESTAMP NOT NULL DEFAULT now()
    );

    CREATE INDEX chat_summaries_chat_id_idx ON chat_summaries(chat_id);
  `);
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS chat_summaries;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS chats;
    DROP TABLE IF EXISTS subtopics;
    DROP TABLE IF EXISTS topics;
  `);
};
