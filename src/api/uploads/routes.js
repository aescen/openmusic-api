const path = require('path');

const routes = (handler) => [
  {
    method: 'POST',
    path: '/upload/pictures',
    handler: handler.postUploadPicturesHandler,
    options: {
      payload: {
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
        maxBytes: 500 * 1024, // 512000B = 500KiB, hapi default size: 1048576B = 1MiB
      },
    },
  },
  {
    method: 'GET',
    path: '/upload/{param*}',
    handler: {
      directory: {
        path: path.resolve(process.cwd(), 'src/api/uploads/files'),
      },
    },
  },
];

module.exports = routes;
