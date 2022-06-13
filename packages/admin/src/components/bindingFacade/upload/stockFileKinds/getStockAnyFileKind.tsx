import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
import { FileUrlFieldView } from '../../fieldViews'
import { defaultUploader } from '../defaultUploader'
import {
	FileUrlDataExtractorProps,
	GenericFileMetadataExtractorProps,
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
} from '../fileDataExtractors'
import type { FileDataExtractor, FullFileKind, RenderFilePreviewOptions } from '../interfaces'
import { PublicFileKind } from '../interfaces/FullFileKind'

export type StockAnyFileKindProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts, SFExtraProps>
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& {
		additionalExtractors?: FileDataExtractor<any, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
	}

export const acceptAnyFile = () => true
export const renderAnyFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => (
	<a
		style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl' }}
		href={objectUrl}
		onClick={e => e.stopPropagation()}
		download
	>
		{objectUrl.substring(Math.max(0, objectUrl.lastIndexOf('/') + 1))}
	</a>
)

export const getStockAnyFileKind = <AcceptArtifacts extends any = unknown>({
	additionalExtractors = emptyArray,
	acceptMimeTypes = null,
	acceptFile = acceptAnyFile,
	baseEntity,
	children,
	fileSizeField,
	fileTypeField,
	lastModifiedField,
	fileNameField,
	renderFilePreview = renderAnyFilePreview,
	renderUploadedFile,
	uploader = defaultUploader,
	urlField,
	...rest
}: StockAnyFileKindProps<AcceptArtifacts>): FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts> => {
	const extractors: FileDataExtractor<any, S3FileUploader.SuccessMetadata, AcceptArtifacts>[] = [
		getFileUrlDataExtractor({ urlField }),
		getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
		...additionalExtractors,
	]
	const renderUploadedAny = renderUploadedFile ?? <FileUrlFieldView fileUrlField={urlField} />

	return {
		acceptFile,
		acceptMimeTypes,
		baseEntity,
		children,
		extractors,
		renderFilePreview,
		renderUploadedFile: renderUploadedAny,
		uploader,
		...rest,
	}
}
