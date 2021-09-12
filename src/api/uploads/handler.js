class UploadsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    this.postUploadPicturesHandler = this.postUploadPicturesHandler.bind(this);
  }

  async postUploadPicturesHandler(request, h) {
    const { data } = request.payload;
    this._validator.validatePictureHeaders(data.hapi.headers);

    const pictureUrl = await this._service.writeFile(data, data.hapi);

    const response = h.response({
      status: 'success',
      message: 'Gambar berhasil diunggah',
      data: {
        pictureUrl,
      },
    });
    response.code(201);

    return response;
  }
}

module.exports = UploadsHandler;
