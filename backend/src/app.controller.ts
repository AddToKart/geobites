import { Controller, Get, Put, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Put('user/profile')
  updateProfile(@Body() body: any) {
    return { success: true, data: body };
  }

  @Get()
  getHealth() {
    return {
      service: 'geobites-backend',
      status: 'ok',
      message: this.appService.getHello(),
      timestamp: new Date().toISOString(),
    };
  }
}
