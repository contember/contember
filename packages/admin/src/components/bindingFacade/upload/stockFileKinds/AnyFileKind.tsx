import { Component } from '@contember/binding'
import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
import type { ReactElement } from 'react'
import { FileUrlFieldView } from '../../fieldViews'
import { defaultUploader } from '../defaultUploader'
import type { FileUrlDataExtractorProps, GenericFileMetadataExtractorProps } from '../fileDataExtractors'
import { getFileUrlDataExtractor, getGenericFileMetadataExtractor } from '../fileDataExtractors'
import { FileKind } from '../FileKind'
import type { DiscriminatedFileKind, FileDataExtractor, RenderFilePreviewOptions } from '../interfaces'

export interface AnyFileKindProps<AcceptArtifacts = unknown, FileData = unknown>
	extends Partial<
			Omit<
				DiscriminatedFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts, FileData>,
				'discriminateBy' | 'extractors'
			>
		>,
		Required<FileUrlDataExtractorProps>,
		GenericFileMetadataExtractorProps {
	discriminateBy: DiscriminatedFileKind['discriminateBy']
	additionalExtractors?: FileDataExtractor<FileData, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
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

export const AnyFileKind = Component<AnyFileKindProps>(
	({
		discriminateBy,
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
	}) => {
		const extractors: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata>[] = [
			getFileUrlDataExtractor({ urlField }),
			getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
			...additionalExtractors,
		]
		const renderUploadedAny = renderUploadedFile ?? <FileUrlFieldView fileUrlField={urlField} />
		return (
			<FileKind
				discriminateBy={discriminateBy}
				acceptMimeTypes={acceptMimeTypes}
				acceptFile={acceptFile}
				renderFilePreview={renderFilePreview}
				renderUploadedFile={renderUploadedAny}
				uploader={uploader}
				extractors={extractors}
				children={children}
			/>
		)
	},
	'AnyFileKind',
) as <AcceptArtifacts = unknown, FileData = unknown>(
	props: AnyFileKindProps<AcceptArtifacts, FileData>,
) => ReactElement | null
