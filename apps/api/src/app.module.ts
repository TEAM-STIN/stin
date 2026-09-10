import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { buildLoggerParams } from './logger/logger.config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [LoggerModule.forRoot(buildLoggerParams()), PrismaModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
