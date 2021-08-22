const { Pool } = require('pg');
const { customAlphabet } = require('nanoid/non-secure');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);

class PlaylistsService {
  constructor(collaborationsService, songsService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
    this._songsService = songsService;
  }

  async addPlaylist(name, owner) {
    const id = `playlist-${nanoid()}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT
                playlists.id,
                playlists.name,
                users.username
             FROM
                playlists
             LEFT JOIN
                collaborations
              ON
                collaborations.playlist_id = playlists.id
             LEFT JOIN
                users
              ON
                users.id = playlists.owner
             WHERE playlists.owner = $1
              OR
                collaborations.user_id = $1`,
      values: [owner],
    };
    const result = await this._pool.query(query);

    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus, id tidak ditemukan');
    }
  }

  async addPlaylistSong(playlistId, { songId }) {
    if (!(await this.verifySongById(songId))) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist, id tidak ditemukan');
    }
    const id = `playlistsongs-${nanoid()}`;
    const query = {
      text: 'INSERT INTO playlistsongs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }
  }

  async getPlaylistSongs(playlistId) {
    const query = {
      text: `SELECT
                songs.id,
                songs.title,
                songs.performer
             FROM
                songs
             LEFT JOIN
                playlistsongs
              ON
                songs.id = playlistsongs.song_id
             WHERE
                playlistsongs.playlist_id = $1`,
      values: [playlistId],
    };
    const result = await this._pool.query(query);

    return result.rows;
  }

  async deletePlaylistSong(playlistId, { songId }) {
    if (!(await this.verifySongById(songId))) {
      throw new InvariantError('Lagu gagal dihapus dari playlist, id tidak ditemukan');
    }
    const query = {
      text: 'DELETE FROM playlistsongs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus dari playlist, id tidak ditemukan');
    }
  }

  async verifyPlaylistOwner(owner, id) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(userId, playlistId) {
    try {
      await this.verifyPlaylistOwner(userId, playlistId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationsService.verifyCollaborator(userId, playlistId);
      } catch {
        throw error;
      }
    }
  }

  async verifySongById(id) {
    try {
      await this._songsService.getSongById(id);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = PlaylistsService;
