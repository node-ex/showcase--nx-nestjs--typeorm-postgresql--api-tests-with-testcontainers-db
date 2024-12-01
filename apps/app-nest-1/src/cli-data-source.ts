/**
 * This file is used to create a TypeORM DataSource instance to use with
 * `typeorm` CLI command.
 */
import { createCliDataSource } from './shared/utils/cli-data-source.utils';

// TypeORM accepts Promise<DataSource> as a data source
// https://github.com/typeorm/typeorm/blob/master/src/commands/CommandUtils.ts#L42
export const AppDataSource = createCliDataSource();
