import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { User } from './auth/user.entity';
import { ServiceEntity } from './services/service.entity';
import { Booking } from './bookings/booking.entity';

const databaseUrl = process.env.DATABASE_URL;
const isPostgres = databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'));

@Module({
  imports: [
    TypeOrmModule.forRoot(
      isPostgres
        ? {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, ServiceEntity, Booking],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
          }
        : {
            type: 'sqlite',
            database: process.env.DB_PATH || '../database.sqlite',
            entities: [User, ServiceEntity, Booking],
            synchronize: true,
          },
    ),
    AuthModule,
    ServicesModule,
    BookingsModule,
  ],
})
export class AppModule {}
