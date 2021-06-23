import type { FileUploader } from '@contember/client'
import { S3FileUploader } from '@contember/client'

export const defaultUploader: FileUploader<S3FileUploader.SuccessMetadata> = new S3FileUploader()
