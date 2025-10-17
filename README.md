<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="http://kamilmysliwiec.com/public/nest-logo.png#1" alt="Nest Logo" />   </a>
  <a href="https://cloudinary.com/" target="_blank"><img src="https://i.imgur.com/1UkYh1o.png" width="150"></a>
</p>

<p align="center">Cloudinary Module for Nest framework</p>

<p align="center">
<a href="https://www.npmjs.com/package/@kaidenki/nestjs-cloudinary"><img src="https://img.shields.io/npm/v/@kaidenki/nestjs-cloudinary" alt="NPM Version" /></a>
<a href="https://img.shields.io/npm/l/@kaidenki/nestjs-cloudinary"><img src="https://img.shields.io/npm/l/@kaidenki/nestjs-cloudinary" alt="Package License" /></a>
<a href="https://www.npmjs.com/package/@kaidenki/nestjs-cloudinary"><img src="https://img.shields.io/npm/dw/@kaidenki/nestjs-cloudinary" alt="NPM Downloads" /></a>

</p>

## Description

This's a [cloudinary](https://cloudinary.com/) module for [Nest](https://github.com/nestjs/nest).
This quickstart guide will show you how to install the client SDK and execute an example JavaScript program.
This document assumes that you have a working [nodejs](http://nodejs.org/) setup in place.

## Installation

```bash
$ pnpm install @kaidenki/nestjs-cloudinary
```

## Initialize cloudinary Client

Provide the credentials for cloudinary module by importing it. More options can be passed as per the [cloudinary documentation](https://cloudinary.com/documentation/node_integration#configuration_parameters).

```javascript
import { Module } from '@nestjs/common';
import { CloudinaryModule } from '@kaidenki/nestjs-cloudinary';

@Module({
	imports: [
		CloudinaryModule.forRootAsync({
			imports: [NestConfigModule],
			useFactory: (configService: ConfigService) => ({
				isGlobal: true,
				cloud_name: configService.get('cloudinary.cloudName'),
				api_key: configService.get('cloudinary.apiKey'),
				api_secret: configService.get('cloudinary.apiSecret'),
			}),
			inject: [ConfigService],
		}),
	],
})
export class NestCloudinaryClientModule {}
```

Then you can use it in the controller or service by injecting it in the controller as:

```typescript
import { CloudinaryService } from '@kaidenki/nestjs-cloudinary';

constructor(private readonly cloudinaryService: CloudinaryService ) {}

```

## Quick Start Example - File Uploader

This example program connects to cloudinary storage server then uploads a file.

```typescript
import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CloudinaryService } from "@kaidenki/nestjs-cloudinary";

@Controller()
export class NestCloudinaryClientController {
    constructor(private readonly cloudinaryService: CloudinaryService) {}
    @Post("upload")
    @UseInterceptors(FileInterceptor("file"))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return this.cloudinaryService.uploadFile(file);
    }
}
```

## API

### Asset Administration

#### `getAsset(publicId: string, options?: any)`

Retrieves details of a single asset.

```typescript
const asset = await this.cloudinaryService.getAsset("public_id");
```

#### `listAssets(options?: any)`

Lists all assets.

```typescript
const assets = await this.cloudinaryService.listAssets();
```

#### `deleteAssets(publicIds: string[], options?: any)`

Deletes multiple assets by their public IDs.

```typescript
const result = await this.cloudinaryService.deleteAssets([
    "public_id1",
    "public_id2",
]);
```

#### `updateAsset(publicId: string, options?: any)`

Updates an asset's details.

```typescript
const result = await this.cloudinaryService.updateAsset("public_id", {
    tags: "new-tag",
});
```

#### `renameAsset(fromPublicId: string, toPublicId: string, options?: any)`

Renames an asset.

```typescript
const result = await this.cloudinaryService.renameAsset(
    "from_public_id",
    "to_public_id"
);
```

#### `deleteAsset(publicId: string, options?: any)`

Deletes a single asset.

```typescript
const result = await this.cloudinaryService.deleteAsset("public_id");
```

### Image and Video Upload

#### `uploadFileByPath(filePath: string, options?: UploadApiOptions)`

Uploads a file from a local path.

```typescript
const result = await this.cloudinaryService.uploadFileByPath(
    "/path/to/your/file.jpg"
);
```

### Image and Video Manipulation

#### `getTransformedUrl(publicId: string, options?: any)`

Generates a URL for an asset with transformations.

```typescript
const url = this.cloudinaryService.getTransformedUrl("public_id", {
    width: 100,
    height: 100,
    crop: "fill",
});
```

#### `getImageTag(publicId: string, options?: any)`

Generates an `<img>` tag for an image asset.

```typescript
const imageTag = this.cloudinaryService.getImageTag("public_id", {
    width: 100,
    height: 100,
    crop: "fill",
});
```

#### `getVideoTag(publicId: string, options?: any)`

Generates a `<video>` tag for a video asset.

```typescript
const videoTag = this.cloudinaryService.getVideoTag("public_id", {
    width: 300,
    height: 200,
    controls: true,
});
```
