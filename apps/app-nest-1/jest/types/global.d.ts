import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { DataSource } from 'typeorm';
import type { Client } from 'pg';

declare global {
  /**
   * Available in the global Node.js context
   */
  // eslint-disable-next-line no-var
  var __POSTGRES_TESTCONTAINER__: StartedPostgreSqlContainer;
  // eslint-disable-next-line no-var
  var __TYPEORM_DATA_SOURCE_TEMPLATE_DB__: DataSource;
  // eslint-disable-next-line no-var
  var __PG_CLIENT_SYSTEM_DB__: Client;

  /**
   * Available in the isolated test context
   */
  // eslint-disable-next-line no-var
  var __TYPEORM_DATA_SOURCE_TEST_DB__: DataSource;
  // eslint-disable-next-line no-var
  var __PG_CLIENT_TEST_DB__: Client;
}

export {};
