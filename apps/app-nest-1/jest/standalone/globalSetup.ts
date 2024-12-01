import type { Config } from '@jest/types';
import { debug as _debug } from 'debug';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { createCliDataSource } from '../../src/shared/utils/cli-data-source.utils';

const debug = _debug('jest-postgres:setup:custom');

/**
 * Important steps:
 * - Start a PostgreSQL testcontainer
 * - Store a reference to the started testcontainer in globalThis
 * - Create and initialize a new TypeORM DataSource for the template database
 * - Run TypeORM migrations
 * - Store a reference to the initialized TypeORM DataSource in globalThis
 */
export default async (
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig,
): Promise<void> => {
  /** For outputting next debug message on a new line */
  debug('');
  debug('standalone setup.ts');

  /** Environment variables are read from the .env file. Don't know how... */
  const postgresUsername = process.env['DB_USERNAME']!;
  const postgresPassword = process.env['DB_PASSWORD']!;
  const postgresTemplateDatabase = process.env['DB_DATABASE']!;
  debug('postgresUsername', postgresUsername);
  debug('postgresPassword', postgresPassword);
  debug('postgresTemplateDatabase', postgresTemplateDatabase);

  /**
   * Starts PostgreSQL on a port 5432 inside container and maps it to a random port on host.
   * https://github.com/testcontainers/testcontainers-node/blob/main/packages/modules/postgresql/src/postgresql-container.ts
   */
  const container = new PostgreSqlContainer('postgres:16.3-alpine3.20')
    .withUsername(postgresUsername)
    .withPassword(postgresPassword)
    .withDatabase(postgresTemplateDatabase);
  const startedContainer = await container.start();
  debug('testcontainer started');

  process.env['DB_HOST'] = startedContainer.getHost();
  process.env['DB_PORT'] = startedContainer.getMappedPort(5432).toString();

  globalThis.__POSTGRES_TESTCONTAINER__ = startedContainer;

  const appDataSource = await createCliDataSource();
  await appDataSource.initialize();
  debug('pending migrations', await appDataSource.showMigrations());
  const executedMigrations = await appDataSource.runMigrations();
  debug(
    'executedMigrations',
    executedMigrations.map((m) => m.name),
  );

  globalThis.__TYPEORM_DATA_SOURCE_TEMPLATE_DB__ = appDataSource;
};
