/* eslint-disable max-len */
/* eslint-disable camelcase */
const mapDb = {
  toSong: ({
    id, title, year, performer, genre, duration, inserted_at, updated_at,
  }) => ({
    id, title, year, performer, genre, duration, insertedAt: inserted_at, updatedAt: updated_at,
  }),
};

module.exports = { mapDb };
