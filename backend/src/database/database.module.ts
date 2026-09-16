import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as entities from '../entities';

import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        const dbHost = configService.get<string>('DB_HOST');
        const entityList = Object.values(entities);

        // 1. PostgreSQL with connection URL (Neon, Supabase, Render, Railway, etc.)
        if (dbUrl) {
          return {
            type: 'postgres',
            url: dbUrl,
            ssl: { rejectUnauthorized: false },
            entities: entityList,
            synchronize: true, // Auto-sync schema in development/staging
            logging: process.env.NODE_ENV === 'development',
          };
        }

        // 2. PostgreSQL with individual parameters
        if (dbHost) {
          const isSsl = configService.get<string>('DB_SSL') === 'true';
          return {
            type: 'postgres',
            host: dbHost,
            port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
            username: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.get<string>('DB_PASSWORD', 'postgres'),
            database: configService.get<string>('DB_DATABASE', 'sudhakarchits'),
            ssl: isSsl ? { rejectUnauthorized: false } : false,
            entities: entityList,
            synchronize: true,
            logging: process.env.NODE_ENV === 'development',
          };
        }

        // 3. SQLite fallback for zero-dependency local testing and self-contained execution
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
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule {}
