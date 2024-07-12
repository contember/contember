import { S3UploadClient, S3UploadClientOptions } from '../uploadClient'
import { useCurrentContentGraphQlClient } from '@contember/react-client'
import { createContentApiS3Signer } from '../utils/urlSigner'

export const useS3Client = (options: Partial<S3UploadClientOptions> = {}) => new S3UploadClient({
	signUrl: createContentApiS3Signer(useCurrentContentGraphQlClient()),
	...options,
})
