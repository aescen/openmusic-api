const Joi = require('joi');

const CollaborationPayloadSchema = Joi.object({
  userId: Joi.string().required(),
  playlistId: Joi.string().required(),
});

module.exports = { CollaborationPayloadSchema };
