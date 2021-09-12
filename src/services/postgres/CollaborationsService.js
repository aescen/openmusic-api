const { Pool } = require('pg');
const { customAlphabet } = require('nanoid/non-secure');
const InvariantError = require('../../exceptions/InvariantError');

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);

class CollaborationsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addCollaboration(userId, playlistId) {
    const collabId = `collab-${nanoid()}`;
    const query = {
      text: 'INSERT INTO collaborations VALUES($1, $2, $3) RETURNING id, user_id',
      values: [collabId, userId, playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Kolaborasi berhasil ditambahkan');
    }
    const { user_id: owner } = result.rows[0];
    await this._cacheService.del(`playlists:${owner}`);
    await this._cacheService.del(`playlist:${playlistId}`);
    return result.rows[0].id;
  }

  async verifyCollaborator(userId, playlistId) {
    const query = {
      text: 'SELECT * FROM collaborations WHERE user_id = $1 AND playlist_id = $2',
      values: [userId, playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Kolaborasi gagal diverifikasi');
    }
  }

  async deleteCollaboration(userId, playlistId) {
    const query = {
      text: 'DELETE FROM collaborations WHERE user_id = $1 AND playlist_id = $2 RETURNING id, user_id',
      values: [userId, playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Kolaborasi gagal dihapus');
    }

    const { user_id: owner } = result.rows[0];
    await this._cacheService.del(`playlists:${owner}`);
    await this._cacheService.del(`playlist:${playlistId}`);
  }
}

module.exports = CollaborationsService;
