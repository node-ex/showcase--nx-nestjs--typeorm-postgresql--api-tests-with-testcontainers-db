import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from '@jest/environment';
import { TestEnvironment as NodeEnvironment } from 'jest-environment-node';
import { debug as _debug } from 'debug';
import { createHash } from 'crypto';
import { Client } from 'pg';

const debug = _debug('jest-postgres:environment:custom');

export default class TestEnvironment extends NodeEnvironment {
  testFilePath: string;

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
    debug('standalone TestEnvironment.constructor');

    this.testFilePath = context.testPath;

    debug('this.testFilePath', this.testFilePath);
  }

  /**
   * Important steps:
   * - Create and connect a new pg Client for the system database
   * - Terminate all connections to the template database
   * - Create a new test database from the template database
   * - Store a reference to the pg Client for the system database in globalThis
   * - Set environment variables of the isolated test context to values required to connect to the test database
   */
  override async setup() {
    await super.setup();

    debug('standalone TestEnvironment.setup');

    const host = globalThis.__POSTGRES_TESTCONTAINER__.getHost();
    const port = globalThis.__POSTGRES_TESTCONTAINER__.getMappedPort(5432);
    const username = globalThis.__POSTGRES_TESTCONTAINER__.getUsername();
    const password = globalThis.__POSTGRES_TESTCONTAINER__.getPassword();
    const templateDatabase =
      globalThis.__POSTGRES_TESTCONTAINER__.getDatabase();
    const systemDatabase = 'postgres';
    debug('host', host);
    debug('port', port);
    debug('username', username);
    debug('password', password);
    debug('templateDatabase', templateDatabase);

    /**
     * When creating a new database via a template database, the
     * template database must not have any connections to it.
     */
    const client = new Client({
      host,
      port,
      user: username,
      password,
      database: systemDatabase,
    });
    await client.connect();
    await client.query(
      `
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid();
    `,
      [templateDatabase],
    );

    /**
     * Requirements for the DB name:
     * - Can contain only ASCII characters
     * - Must be at least 1 character long and no more than 64 bytes long
     *
     * MD5 hash in a hexadecimal format is 32 characters long and contains only
     * ASCII letters and numbers, so it should be a valid DB name.
     *
     * Sources
     * - https://www.postgresql.org/docs/current/datatype-character.html
     *   - See the name type documentation
     */
    const dbName =
      'test_' + createHash('md5').update(this.testFilePath).digest('hex');
    await client.query(
      `CREATE DATABASE ${dbName} TEMPLATE ${templateDatabase}`,
    );

    globalThis.__PG_CLIENT_SYSTEM_DB__ = client;

    /**
     * When DB_HOST, DB_PORT, and DB_DATABASE are set via process.env here,
     * tests do not see this change because they are run inside the
     * `this.global` vm context that is isolated from the global Node.js
     * context. Only environment variables present in the global Node.js
     * context (process.env) at the time of isolated context creation are
     * available to the tests.
     *
     * But setting them via this.global.process.env works.
     */
    this.global.process.env['DB_HOST'] = host;
    this.global.process.env['DB_PORT'] = port.toString();
    this.global.process.env['DB_DATABASE'] = dbName;

    debug('process.env[DB_DATABASE]', process.env['DB_DATABASE']);
    debug(
      'this.global.process.env[DB_DATABASE]',
      this.global.process.env['DB_DATABASE'],
    );
  }

  /**
   * Important steps:
   * - Drop the test database (there should be no connections to it)
   * - Terminate the pg Client connection to the system database
   */
  override async teardown() {
    debug('standalone TestEnvironment.teardown - before super');
    await super.teardown();
    debug('standalone TestEnvironment.teardown - after super');

    debug(
      "this.global.process.env['DB_DATABASE']",
      this.global.process.env['DB_DATABASE'],
    );

    const dbName = this.global.process.env['DB_DATABASE']!;
    const client = globalThis.__PG_CLIENT_SYSTEM_DB__;
    /* Parameterized placeholders cannot be used for database, table, or column names */
    await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
    await client.end();
  }

  override getVmContext() {
    /* A lot of calls... */
    // debug('standalone TestEnvironment.getVmContext');
    return super.getVmContext();
  }
}
