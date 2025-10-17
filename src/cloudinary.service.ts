/* eslint-disable import/named */
import { Readable } from "node:stream";

import { Inject, Injectable, Logger } from "@nestjs/common";
import {
    ResourceType,
    UploadApiErrorResponse,
    UploadApiOptions,
    UploadApiResponse,
    v2 as cloudinary,
} from "cloudinary";
import sharp from "sharp";

import { CloudinaryModuleOptions } from "./cloudinary.options";
import {
    IFile,
    ISharpInputOptions,
    ISignedUploadUrlOptions,
} from "./interfaces";
import { MODULE_OPTIONS_TOKEN } from "./cloudinary.module-definition";
import { defaultCreateSignedUploadUrlOptions } from "./cloudinary.constant";

@Injectable()
export class CloudinaryService {
    private logger = new Logger(CloudinaryService.name);
    public readonly cloudinary = cloudinary;

    constructor(
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly options: CloudinaryModuleOptions
    ) {
        this.cloudinary.config(Object.assign({}, options));
    }

    pingCloudinary() {
        cloudinary.api
            .ping()
            .then((res) => {
                this.logger.log(`Cloudinary connection ${res.status}`);
            })
            .catch((err) => {
                this.logger.warn("Cloudinary connection failed.");
                this.logger.error(err.error);
            });
    }

    /**
     * It takes a file, uploads it to cloudinary, and returns a promise
     * @param {IFile} file - IFile - This is the file object that is passed to the uploadFile method.
     * @param {UploadApiOptions} [options] - This is the options object that you can pass to the
     * uploader.upload_stream method.
     * @param {ISharpInputOptions} [sharpOptions] - This is an object that contains the options for sharp.
     * @returns | UploadApiResponse
     * 						| UploadApiErrorResponse
     * 						| PromiseLike<UploadApiResponse | UploadApiErrorResponse>,
     */
    async uploadFile(
        file: IFile,
        options?: UploadApiOptions,
        sharpOptions?: ISharpInputOptions
    ): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise(async (resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                options,
                (
                    error: any,
                    result:
                        | UploadApiResponse
                        | UploadApiErrorResponse
                        | PromiseLike<
                              UploadApiResponse | UploadApiErrorResponse
                          >
                ) => {
                    if (error) {
                        this.logger.error(error);

                        return reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            const stream: Readable = new Readable();

            if (sharpOptions && file.mimetype.match(/^image/)) {
                const options = { width: 800, ...sharpOptions };
                const shrinkedImage = await sharp(file.buffer)
                    .resize(options)
                    .toBuffer();

                stream.push(shrinkedImage);
            } else {
                stream.push(file.buffer);
            }
            stream.push(null);

            stream.pipe(upload);
        });
    }

    /**
     * It takes a file path, uploads it to cloudinary, and returns a promise
     * @param {string} filePath - The path to the file to upload.
     * @param {UploadApiOptions} [options] - This is the options object that you can pass to the
     * uploader.upload method.
     * @returns A promise that resolves with the upload result.
     */
    uploadFileByPath(
        filePath: string,
        options?: UploadApiOptions
    ): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            this.cloudinary.uploader.upload(
                filePath,
                options,
                (error, result) => {
                    if (error) {
                        this.logger.error(error);
                        return reject(error);
                    }
                    resolve(result);
                }
            );
        });
    }

    /**
     * It returns a signed upload URL.	 * @see https://cloudinary.com/documentation/signatures#using_cloudinary_backend_sdks_to_generate_sha_authentication_signatures
     * @param {string} publicId - This is the public id of the file.
     * @param {ResourceType} resourceType - The type of the resource. See ./node_modules/cloudinary/types/index.d.ts
     * @param {ISignedUploadUrlOptions} [options] - This is an object that contains the options for signing.
     * @returns string
     */
    async createSignedUploadUrl(
        publicId: string,
        resourceType: ResourceType,
        options?: ISignedUploadUrlOptions
    ) {
        options = { ...defaultCreateSignedUploadUrlOptions, ...options };

        const url = `https://api.cloudinary.com/v1_1/${this.options.cloud_name}/${resourceType}/upload`;
        const timestamp = Math.floor(Date.now() / 1000).toString();

        const signature = this.cloudinary.utils.api_sign_request(
            {
                timestamp,
                folder: options.folder,
                eager: options.eager,
                public_id: publicId,
            },
            this.options.api_secret
        );

        return {
            url,
            publicId,
            apiKey: this.options.api_key,
            timestamp,
            eager: options.eager,
            folder: options.folder,
            signature,
        };
    }

    /**
     * It returns the cloudinary instance.
     * @returns The cloudinary instance.
     */
    get cloudinaryInstance() {
        return this.cloudinary;
    }

    /**
     * It returns the asset details.
     * @param {string} publicId - This is the public id of the file.
     * @param {any} [options] - This is an object that contains the options for the asset.
     * @returns The asset details.
     */
    getAsset(publicId: string, options?: any) {
        return this.cloudinary.api.resource(publicId, options);
    }

    /**
     * It returns a list of assets.
     * @param {any} [options] - This is an object that contains the options for the assets.
     * @returns A list of assets.
     */
    listAssets(options?: any) {
        return this.cloudinary.api.resources(options);
    }

    /**
     * It deletes a list of assets.
     * @param {string[]} publicIds - This is a list of public ids of the files.
     * @param {any} [options] - This is an object that contains the options for the assets.
     * @returns The result of the deletion.
     */
    deleteAssets(publicIds: string[], options?: any) {
        return this.cloudinary.api.delete_resources(publicIds, options);
    }

    /**
     * It updates an asset.
     * @param {string} publicId - This is the public id of the file.
     * @param {any} [options] - This is an object that contains the options for the asset.
     * @returns The result of the update.
     */
    updateAsset(publicId: string, options?: any) {
        return this.cloudinary.api.update(publicId, options);
    }

    /**
     * It renames an asset.
     * @param {string} fromPublicId - This is the public id of the file to be renamed.
     * @param {string} toPublicId - This is the new public id of the file.
     * @param {any} [options] - This is an object that contains the options for the asset.
     * @returns The result of the rename.
     */
    renameAsset(fromPublicId: string, toPublicId: string, options?: any) {
        return this.cloudinary.uploader.rename(
            fromPublicId,
            toPublicId,
            options
        );
    }

    /**
     * It deletes an asset.
     * @param {string} publicId - This is the public id of the file.
     * @param {any} [options] - This is an object that contains the options for the asset.
     * @returns The result of the deletion.
     */
    deleteAsset(publicId: string, options?: any) {
        return this.cloudinary.uploader.destroy(publicId, options);
    }

    /**
     * It returns a transformed URL for an asset.
     * @param {string} publicId - This is the public id of the file.
     * @param {any} [options] - This is an object that contains the options for the transformation.
     * @returns A transformed URL.
     */
    getTransformedUrl(publicId: string, options?: any) {
        return this.cloudinary.url(publicId, options);
    }

    /**
     * It returns an image tag for an asset.
     * @param {string} publicId - This is the public id of the file.
     * @param {any} [options] - This is an object that contains the options for the image tag.
     * @returns An image tag.
     */
    getImageTag(publicId: string, options?: any) {
        return this.cloudinary.image(publicId, options);
    }

    /**
     * It returns a video tag for an asset.
     * @param {string} publicId - This is the public id of the file.
     * @param {any} [options] - This is an object that contains the options for the video tag.
     * @returns A video tag.
     */
    getVideoTag(publicId: string, options?: any) {
        return this.cloudinary.video(publicId, options);
    }
}
