const { Pool } = require('pg');
const { customAlphabet } = require('nanoid/non-secure');

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDbToSong, mapDbToSongs } = require('../../utils');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong(payload) {
    const {
      title, year, performer, genre, duration,
    } = payload;
    const id = `song-${nanoid()}`;
    const insertedAt = new Date().toISOString();
    const updatedAt = insertedAt;

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      values: [id, title, year, performer, genre, duration, insertedAt, updatedAt],
    };

    const result = await this._pool.query(query);

    const resultOk = result.rows[0].id;

    if (!resultOk) {
      throw new InvariantError('Failed to add song.');
    }

    return resultOk;
  }

  async getSongs() {
    const result = await this._pool.query('SELECT * FROM songs');
    return result.rows.map(mapDbToSongs);
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const song = await this._pool.query(query);
    if (!song.rows.length) {
      throw new NotFoundError('Song not found.');
    }
    return song.rows.map(mapDbToSong)[0];
  }

  async editSong(id, payload) {
    const {
      title, year, performer, genre, duration,
    } = payload;
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, updated_at = $6 WHERE id = $7 RETURNING id',
      values: [title, year, performer, genre, duration, updatedAt, id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Failed to edit song. Song not Found.');
    }
  }

  async deleteSong(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Failed to delete song. Song not Found.');
    }
  }
}

module.exports = SongsService;
