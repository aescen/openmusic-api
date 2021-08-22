class AuthenticationsHandler {
  constructor(
    authenticationsService,
    usersService,
    tokenManager,
    validator,
  ) {
    this._authenticationsService = authenticationsService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    this.postAuthenticationsHandler = this.postAuthenticationsHandler.bind(this);
    this.putAuthenticationsHandler = this.putAuthenticationsHandler.bind(this);
    this.deleteAuthenticationsHandler = this.deleteAuthenticationsHandler.bind(this);
  }

  async postAuthenticationsHandler(request, h) {
    this._validator.validatePostAuthenticationPayload(request.payload);

    const id = await this._usersService.verifyUserCredential(request.payload);
    const accessToken = this._tokenManager.generateAccessToken({ id });
    const refreshToken = this._tokenManager.generateRefreshToken({ id });

    await this._authenticationsService.addRefreshToken(refreshToken);

    const response = h.response({
      status: 'success',
      message: 'Authentication berhasil ditambahkan',
      data: {
        accessToken,
        refreshToken,
      },
    });

    response.code(201);
    return response;
  }

  async putAuthenticationsHandler(request) {
    this._validator.validatePutAuthenticationPayload(request.payload);

    await this._authenticationsService.verifyRefreshToken(request.payload);
    const { id } = this._tokenManager.verifyRefreshToken(request.payload);

    const accessToken = this._tokenManager.generateAccessToken(id);
    return {
      status: 'success',
      message: 'Authentication berhasil diperbarui',
      data: {
        accessToken,
      },
    };
  }

  async deleteAuthenticationsHandler(request) {
    this._validator.validateDeleteAuthenticationPayload(request.payload);

    await this._authenticationsService.verifyRefreshToken(request.payload);
    await this._authenticationsService.deleteRefreshToken(request.payload);

    return {
      status: 'success',
      message: 'Refresh token berhasil dihapus',
    };
  }
}

module.exports = AuthenticationsHandler;
