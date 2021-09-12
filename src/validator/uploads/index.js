const InvariantError = require('../../exceptions/InvariantError');
const { PictureHeaderSchema } = require('./schema');

const UploadsValidator = {
  validatePictureHeaders: (headers) => {
    const validationResult = PictureHeaderSchema.validate(headers);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message.replace(/"/g, '\''));
    }
  },
};

module.exports = UploadsValidator;
