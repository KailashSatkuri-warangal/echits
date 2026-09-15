import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as entities from '../entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isPostgres = !!configService.get<string>('DATABASE_URL') || !!configService.get<string>('DB_HOST');
        const entityList = Object.values(entities);

        if (isPostgres) {
          const dbUrl = configService.get<string>('DATABASE_URL');
          const isSsl = !!dbUrl || configService.get<string>('DB_SSL') === 'true';

          return {
            type: 'postgres',
            url: dbUrl,
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
            username: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.get<string>('DB_PASSWORD', 'postgres'),
            database: configService.get<string>('DB_DATABASE', 'echits'),
            ssl: isSsl ? { rejectUnauthorized: false } : false,
            entities: entityList,
            synchronize: true, // Auto-sync schema in development/staging
            logging: process.env.NODE_ENV === 'development',
          };
        }

        // SQLite fallback for zero-dependency local testing and self-contained execution
        return {
          type: 'better-sqlite3',
          database: configService.get<string>('SQLITE_PATH', 'echits.db'),
          entities: entityList,
          synchronize: true,
          logging: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
