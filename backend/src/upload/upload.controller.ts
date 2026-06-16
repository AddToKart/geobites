import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { SessionGuard } from '../common/guards/session.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

function imageFileFilter(_req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) {
  if (!file.mimetype.match(/^image\/(png|jpe?g|webp)$/)) {
    callback(new Error('Only PNG, JPG, and WEBP images are allowed'), false);
    return;
  }
  callback(null, true);
}

function uniqueFilename(_req: any, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = extname(file.originalname);
  callback(null, `${uniqueSuffix}${ext}`);
}

@Controller('upload')
@UseGuards(SessionGuard)
export class UploadController {
  @Post('profile')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'profiles'),
        filename: uniqueFilename,
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    }),
  )
  uploadProfile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return { url: `/uploads/profiles/${file.filename}` };
  }

  @Post('menu')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'menu'),
        filename: uniqueFilename,
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    }),
  )
  uploadMenu(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return { url: `/uploads/menu/${file.filename}` };
  }
}
