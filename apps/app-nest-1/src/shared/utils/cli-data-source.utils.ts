import { NestFactory } from '@nestjs/core';
import {
  ConfigModule,
  // ConfigService
} from '@nestjs/config';
import { DataSource } from 'typeorm';
import { CliDataSourceModule } from '../../modules/cli-data-source/cli-data-source.module';
import { DataSourceService } from '../../modules/data-source/services/data-source/data-source.service';

export async function createCliDataSource(): Promise<DataSource> {
  await ConfigModule.envVariablesLoaded;
  const app = await NestFactory.createApplicationContext(CliDataSourceModule, {
    logger: false,
  });
  const dataSourceService = app.get(DataSourceService);
  const dataSource = new DataSource(
    dataSourceService.getDataSourceOptions(true),
  );

  return dataSource;
}
