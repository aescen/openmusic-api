require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
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

// exports
const _exports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

// uploads
const uploads = require('./api/uploads');
const StorageService = require('./services/localstorage/LocalStorageService');
/// const StorageService = require('./services/S3/S3Service');
const UploadsValidator = require('./validator/uploads');

// cache
const CacheService = require('./services/redis/CacheService');

const init = async () => {
  try {
    const cacheService = new CacheService();
    const authenticationsService = new AuthenticationsService();
    const collaborationsService = new CollaborationsService(cacheService);
    const songsService = new SongsService();
    const usersService = new UsersService();
    const playlistsService = new PlaylistsService(
      collaborationsService, songsService, cacheService,
    );
    const storageService = new StorageService();

    const server = Hapi.server({
      port: process.env.PORT,
      host: process.env.HOST,
      routes: {
        cors: {
          origin: ['*'],
        },
      },
    });

    await server.register([
      {
        plugin: Inert,
      },
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
      {
        plugin: _exports,
        options: {
          exportsService: ProducerService,
          playlistsService,
          validator: ExportsValidator,
        },
      },
      {
        plugin: uploads,
        options: {
          service: storageService,
          validator: UploadsValidator,
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
    console.error(error);
  }
};

init();
