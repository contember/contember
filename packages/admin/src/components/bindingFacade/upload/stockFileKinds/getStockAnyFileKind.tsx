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

export interface StockAnyFileKindProps<AcceptArtifacts = unknown>
	extends Partial<Omit<FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts>, 'extractors'>>,
		FileUrlDataExtractorProps,
		GenericFileMetadataExtractorProps {
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
	children,
	fileSizeField,
	fileTypeField,
	lastModifiedField,
	fileNameField,
	renderFilePreview = renderAnyFilePreview,
	renderUploadedFile,
	uploader = defaultUploader,
	urlField,
}: StockAnyFileKindProps<AcceptArtifacts>): FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts> => {
	const extractors: FileDataExtractor<any, S3FileUploader.SuccessMetadata, AcceptArtifacts>[] = [
		getFileUrlDataExtractor({ urlField }),
		getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
		...additionalExtractors,
	]
	const renderUploadedAny = renderUploadedFile ?? <FileUrlFieldView fileUrlField={urlField} />

	return {
		acceptFile: acceptFile,
		acceptMimeTypes: acceptMimeTypes,
		children: children,
		extractors: extractors,
		renderFilePreview: renderFilePreview,
		renderUploadedFile: renderUploadedAny,
		uploader: uploader,
	}
}
