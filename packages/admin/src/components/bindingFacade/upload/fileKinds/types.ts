import { PublicFileKind } from './FullFileKind'
import { FileDataExtractor, FileUrlDataExtractorProps, GenericFileMetadataExtractorProps } from '../fileDataExtractors'
import type { S3FileUploader } from '@contember/client'

export type CommonFileKindProps<AcceptArtifacts = unknown> =
	& PublicFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts>
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& {
		additionalExtractors?: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
	}
