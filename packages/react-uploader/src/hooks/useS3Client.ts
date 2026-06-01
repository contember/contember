import { S3UploadClient, S3UploadClientOptions } from '../uploadClient/index.js'
import { useCurrentContentGraphQlClient } from '@contember/react-client'
import { createContentApiS3Signer } from '../utils/urlSigner.js'

export const useS3Client = (options: Partial<S3UploadClientOptions> = {}) =>
	new S3UploadClient({
		signUrl: createContentApiS3Signer(useCurrentContentGraphQlClient()),
		...options,
	})
