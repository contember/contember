import { S3UploadClient } from '../uploadClient/S3UploadClient'
import { useCurrentContentGraphQlClient } from '@contember/react-client'

export const useS3Client = () => new S3UploadClient(useCurrentContentGraphQlClient())
