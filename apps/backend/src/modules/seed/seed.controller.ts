import { Controller, Post } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('api/seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('demo')
  async seedDemo() {
    return this.seedService.seedDemo();
  }
}