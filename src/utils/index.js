/* eslint-disable max-len */
/* eslint-disable camelcase */
const mapDb = {
  toSong: ({
    id, title, year, performer, genre, duration, inserted_at, updated_at,
  }) => ({
    id, title, year, performer, genre, duration, insertedAt: inserted_at, updatedAt: updated_at,
  }),

  toSongs: ({
    id, title, performer,
  }) => ({
    id, title, performer,
  }),

  toPlaylists: ({ id, name, username }) => ({ id, name, username }),

  toPlaylistSongs: ({ id, title, performer }) => ({ id, title, performer }),
};

module.exports = { mapDb };
