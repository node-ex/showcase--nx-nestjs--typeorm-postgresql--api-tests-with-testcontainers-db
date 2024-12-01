import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceService } from '../../modules/data-source/services/data-source/data-source.service';
import { DataSourceModule } from '../../modules/data-source/data-source.module';

export const typeOrmModuleImports = [
  TypeOrmModule.forRootAsync({
    imports: [DataSourceModule],
    useFactory: (dataSourceService: DataSourceService) =>
      dataSourceService.getTypeOrmModuleOptions(),
    inject: [DataSourceService],
  }),
];
