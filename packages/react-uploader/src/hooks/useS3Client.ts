import { S3UploadClient } from '../uploadClient/S3UploadClient'
import { useCurrentContentGraphQlClient } from '@contember/react-client'
import { createBatchSignedUrlGenerator } from '../internal/utils/urlSigner'

export const useS3Client = () => new S3UploadClient(createBatchSignedUrlGenerator(useCurrentContentGraphQlClient()))
