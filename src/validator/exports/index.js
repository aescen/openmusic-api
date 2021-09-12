const InvariantError = require('../../exceptions/InvariantError');
const { ExportPlaylistSongsPayloadSchema } = require('./schema');

const ExportsValidator = {
  validateExportPlaylistSongsPayload: (payload) => {
    const validationResult = ExportPlaylistSongsPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = ExportsValidator;
