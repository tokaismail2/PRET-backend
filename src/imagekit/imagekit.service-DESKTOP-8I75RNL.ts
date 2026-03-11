import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';

@Injectable()
export class ImageKitService implements OnModuleInit {
  private imagekit: ImageKit;

  constructor(private configService: ConfigService) { }

  onModuleInit() {
    const publicKey = this.configService.get<string>('IMAGEKIT_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('IMAGEKIT_PRIVATE_KEY');
    const urlEndpoint = this.configService.get<string>('IMAGEKIT_URL_ENDPOINT');

    console.log('PUBLIC:', publicKey);
    console.log('PRIVATE:', privateKey);
    console.log('ENDPOINT:', urlEndpoint);

    if (!publicKey || !privateKey || !urlEndpoint) {
      console.warn(
        'ImageKit not initialized. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT environment variables.',
      );
      return;
    }

    this.imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }

  getImageKit(): ImageKit {
    if (!this.imagekit) {
      throw new BadRequestException(
        'ImageKit not initialized. Please configure ImageKit credentials.',
      );
    }
    return this.imagekit;
  }

  async uploadFile(
    file: any,
    folder: string = 'generators',
    fileName?: string,
  ): Promise<{ url: string; fileId: string }> {
    if (!this.imagekit) {
      throw new BadRequestException(
        'ImageKit not initialized. Please configure ImageKit credentials.',
      );
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG and PNG images are allowed.',
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size exceeds 10MB limit. Please upload a smaller file.',
      );
    }

    try {
      const uploadResponse = await this.imagekit.upload({
        file: file.buffer,
        fileName: fileName || `${Date.now()}-${file.originalname}`,
        folder: `/${folder}`,
      });

      return {
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload file to ImageKit: ${error.message}`,
      );
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.imagekit) {
      throw new BadRequestException(
        'ImageKit not initialized. Please configure ImageKit credentials.',
      );
    }

    try {
      await this.imagekit.deleteFile(fileId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete file from ImageKit: ${error.message}`,
      );
    }
  }
}

