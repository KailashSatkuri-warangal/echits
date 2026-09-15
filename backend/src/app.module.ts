import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MembersModule } from './modules/members/members.module';
import { ChitsModule } from './modules/chits/chits.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReversalsModule } from './modules/reversals/reversals.module';
import { LiftModule } from './modules/lift/lift.module';
import { DailyClosingModule } from './modules/daily-closing/daily-closing.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MembersModule,
    ChitsModule,
    MembershipsModule,
    LedgerModule,
    PaymentsModule,
    ReversalsModule,
    LiftModule,
    DailyClosingModule,
    ReportsModule,
    DocumentsModule,
    NotificationsModule,
    CommunicationsModule,
    AuditModule,
    SettingsModule,
  ],
})
export class AppModule {}
