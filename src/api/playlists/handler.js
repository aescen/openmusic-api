class PlaylistsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);
    this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this);
    this.deletePlaylistByIdHandler = this.deletePlaylistByIdHandler.bind(this);
    this.postPlaylistSongHandler = this.postPlaylistSongHandler.bind(this);
    this.getPlaylistSongsHandler = this.getPlaylistSongsHandler.bind(this);
    this.deletePlaylistSongByIdHandler = this.deletePlaylistSongByIdHandler.bind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePostPlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: userId } = request.auth.credentials;

    const playlistId = await this._service.addPlaylist(name, userId);

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: userId } = request.auth.credentials;

    const playlists = await this._service.getPlaylists(userId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request) {
    const { playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(userId, playlistId);
    await this._service.deletePlaylistById(playlistId);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postPlaylistSongHandler(request, h) {
    const { playlistId } = request.params;
    const { id: userId } = request.auth.credentials;
    this._validator.validatePostPlaylistSongPayload(request.payload);

    await this._service.verifyPlaylistAccess(userId, playlistId);
    await this._service.addPlaylistSong(playlistId, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongsHandler(request) {
    const { playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(userId, playlistId);
    const songs = await this._service.getPlaylistSongs(playlistId);
    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async deletePlaylistSongByIdHandler(request) {
    const { playlistId } = request.params;
    const { id: userId } = request.auth.credentials;
    this._validator.validatePostPlaylistSongPayload(request.payload);

    await this._service.verifyPlaylistAccess(userId, playlistId);
    await this._service.deletePlaylistSong(playlistId, request.payload);

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    };
  }
}

module.exports = PlaylistsHandler;
