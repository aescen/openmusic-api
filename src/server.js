require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const ClientError = require('./exceptions/ClientError');

// authentications
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');
// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationValidator = require('./validator/collaboration');
// playlists
const playlists = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistsValidator = require('./validator/playlists');
// songs
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');
// users
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });
  const authenticationsService = new AuthenticationsService();
  const collaborationsService = new CollaborationsService();
  const songsService = new SongsService();
  const usersService = new UsersService();
  const playlistsService = new PlaylistsService(collaborationsService, songsService);

  try {
    await server.register([
      {
        plugin: Jwt,
      },
    ]);

    server.auth.strategy('openmusicapp_jwt', 'jwt', {
      keys: process.env.ACCESS_TOKEN_KEY,
      verify: {
        aud: false,
        iss: false,
        sub: false,
        maxAgeSec: process.env.ACCESS_TOKEN_AGE,
      },
      validate: (artifacts) => ({
        isValid: true,
        credentials: {
          id: artifacts.decoded.payload.id,
        },
      }),
    });

    await server.register([
      {
        plugin: authentications,
        options: {
          authenticationsService,
          usersService,
          tokenManager: TokenManager,
          validator: AuthenticationsValidator,
        },
      },
      {
        plugin: collaborations,
        options: {
          collaborationsService,
          playlistsService,
          validator: CollaborationValidator,
        },
      },
      {
        plugin: playlists,
        options: {
          service: playlistsService,
          validator: PlaylistsValidator,
        },
      },
      {
        plugin: songs,
        options: {
          service: songsService,
          validator: SongsValidator,
        },
      },
      {
        plugin: users,
        options: {
          service: usersService,
          validator: UsersValidator,
        },
      },
    ]);

    server.ext('onPreResponse', (request, h) => {
      const { response } = request;

      if (response instanceof (ClientError)) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      // Server Error
      if (response instanceof (Error) && response.isServer) {
        console.error(response.stack);
        const newResponse = h.response({
          status: 'error',
          message: 'Maaf, terjadi kegagalan pada server kami.',
        });
        newResponse.code(500);
        return newResponse;
      }

      return response.continue || response;
    });

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
  } catch (error) {
    console.log(error);
  }
};

init();
