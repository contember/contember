import { Component } from '@contember/binding'
import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
import type { ReactElement } from 'react'
import { ImageFieldView } from '../../fieldViews'
import { defaultUploader } from '../defaultUploader'
import type {
	DestroyDataExtractorProps,
	FileUrlDataExtractorProps,
	GenericFileMetadataExtractorProps,
	ImageFileDataExtractorProps,
} from '../fileDataExtractors'
import {
	getDestroyDataExtractor,
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
	getImageFileDataExtractor,
} from '../fileDataExtractors'
import { FileKind } from '../FileKind'
import type {
	AcceptFileOptions,
	DiscriminatedFileKind,
	FileDataExtractor,
	RenderFilePreviewOptions,
} from '../interfaces'

export interface ImageFilesProps<AcceptArtifacts = unknown>
	extends Partial<
			Omit<DiscriminatedFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts>, 'discriminateBy' | 'extractors'>
		>,
		Required<FileUrlDataExtractorProps>,
		GenericFileMetadataExtractorProps,
		DestroyDataExtractorProps,
		ImageFileDataExtractorProps {
	discriminateBy: DiscriminatedFileKind['discriminateBy']
	additionalExtractors?: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
}

export const acceptImageFile = ({ file }: AcceptFileOptions) => file.type.startsWith('image')
export const renderImageFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => <img src={objectUrl} alt="" />

export const ImageFiles = Component<ImageFilesProps>(
	({
		discriminateBy,
		additionalExtractors = emptyArray,
		acceptMimeTypes = 'image/*',
		acceptFile = acceptImageFile,
		children,
		deleteOnRemoveField,
		fileSizeField,
		fileTypeField,
		lastModifiedField,
		fileNameField,
		renderFilePreview = renderImageFilePreview,
		renderUploadedFile,
		heightField,
		widthField,
		uploader = defaultUploader,
		urlField,
	}) => {
		const extractors: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata>[] = [
			getFileUrlDataExtractor({ urlField }),
			getDestroyDataExtractor({ deleteOnRemoveField }),
			getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
			getImageFileDataExtractor({ heightField, widthField }),
			...additionalExtractors,
		]
		const renderUploadedImage = renderUploadedFile ?? <ImageFieldView srcField={urlField} />
		return (
			<FileKind
				discriminateBy={discriminateBy}
				acceptMimeTypes={acceptMimeTypes}
				acceptFile={acceptFile}
				renderFilePreview={renderFilePreview}
				renderUploadedFile={renderUploadedImage}
				uploader={uploader}
				extractors={extractors}
				children={children}
			/>
		)
	},
	'ImageFiles',
) as <AcceptArtifacts = unknown>(props: ImageFilesProps<AcceptArtifacts>) => ReactElement | null
