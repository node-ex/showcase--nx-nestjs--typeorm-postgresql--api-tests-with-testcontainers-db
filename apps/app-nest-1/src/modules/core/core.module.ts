import { Module } from '@nestjs/common';
import { configModuleImports } from '../../shared/imports/config-module.imports';
import { HelloWorldModule } from '../hello-world/hello-world.module';
import { TypeormModule } from '../typeorm/typeorm.module';
import { typeOrmModuleImports } from '../../shared/imports/typeorm-module.imports';

@Module({
  imports: [
    ...configModuleImports,
    ...typeOrmModuleImports,
    HelloWorldModule,
    TypeormModule,
  ],
})
export class CoreModule {}
