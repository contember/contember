import { Component } from '@contember/binding'
import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
import type { ReactElement } from 'react'
import { FileUrlFieldView } from '../../fieldViews'
import { defaultUploader } from '../defaultUploader'
import type {
	DestroyDataExtractorProps,
	FileUrlDataExtractorProps,
	GenericFileMetadataExtractorProps,
} from '../fileDataExtractors'
import {
	getDestroyDataExtractor,
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
} from '../fileDataExtractors'
import { FileKind } from '../FileKind'
import type { DiscriminatedFileKind, FileDataExtractor, RenderFilePreviewOptions } from '../interfaces'

export interface AnyFilesProps<AcceptArtifacts = unknown>
	extends Partial<
			Omit<DiscriminatedFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts>, 'discriminateBy' | 'extractors'>
		>,
		Required<FileUrlDataExtractorProps>,
		DestroyDataExtractorProps,
		GenericFileMetadataExtractorProps {
	discriminateBy: DiscriminatedFileKind['discriminateBy']
	additionalExtractors?: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
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

export const AnyFiles = Component<AnyFilesProps>(
	({
		discriminateBy,
		additionalExtractors = emptyArray,
		acceptMimeTypes = null,
		acceptFile = acceptAnyFile,
		children,
		deleteOnRemoveField,
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
			getDestroyDataExtractor({ deleteOnRemoveField }),
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
	'AnyFiles',
) as <AcceptArtifacts = unknown>(props: AnyFilesProps<AcceptArtifacts>) => ReactElement | null
