import { Module } from '@nestjs/common';
import { configModuleImports } from '../../shared/imports/config-module.imports';
import { DataSourceModule } from '../data-source/data-source.module';

@Module({
  imports: [...configModuleImports, DataSourceModule],
})
export class CliDataSourceModule {}
