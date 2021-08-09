/* eslint-disable max-len */
/* eslint-disable camelcase */
const mapDbToSong = ({
  id, title, year, performer, genre, duration, inserted_at, updated_at,
}) => ({
  id, title, year, performer, genre, duration, insertedAt: inserted_at, updatedAt: updated_at,
});

const mapDbToSongs = ({
  id, title, performer,
}) => ({
  id, title, performer,
});

module.exports = { mapDbToSong, mapDbToSongs };
