class ExportsHandler {
  constructor(exportsService, playlistsService, validator) {
    this._exportsService = exportsService;
    this._playlistsService = playlistsService;
    this._validator = validator;

    this.postExportPlaylistSongsHandler = this.postExportPlaylistSongsHandler.bind(this);
  }

  async postExportPlaylistSongsHandler(request, h) {
    this._validator.validateExportPlaylistSongsPayload(request.payload);
    const { playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistAccess(userId, playlistId);

    const message = {
      playlistId,
      targetEmail: request.payload.targetEmail,
    };

    await this._exportsService.sendMessage('export:playlist-songs', JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
