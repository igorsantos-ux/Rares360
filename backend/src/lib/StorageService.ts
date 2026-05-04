import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface StorageProvider {
    upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
    delete(key: string): Promise<void>;
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

export class S3StorageProvider implements StorageProvider {
    private client: S3Client;
    private bucket: string;

    constructor() {
        const region = process.env.AWS_REGION;
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const bucket = process.env.AWS_S3_BUCKET;

        if (!region || !accessKeyId || !secretAccessKey || !bucket) {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('CONFIGURAÇÃO CRÍTICA AUSENTE: AWS S3 env vars não encontradas.');
            }
        }

        this.client = new S3Client({
            region: region || 'us-east-1',
            credentials: {
                accessKeyId: accessKeyId || 'dummy',
                secretAccessKey: secretAccessKey || 'dummy',
            },
            // Suporte para R2/Supabase (Custom Endpoint)
            endpoint: process.env.AWS_S3_ENDPOINT || undefined,
            forcePathStyle: !!process.env.AWS_S3_ENDPOINT,
        });
        this.bucket = bucket || 'rares360-uploads';
    }

    async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        });

        await this.client.send(command);
        
        // Se houver um endpoint customizado (R2/S3), gera a URL baseada nele
        if (process.env.AWS_S3_PUBLIC_URL) {
            return `${process.env.AWS_S3_PUBLIC_URL}/${key}`;
        }
        
        return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    }

    async delete(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        await this.client.send(command);
    }

    async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return getSignedUrl(this.client, command, { expiresIn });
    }
}

// Singleton para exportação
export const storageProvider: StorageProvider = new S3StorageProvider();
