import { Component } from '@contember/binding'
import * as React from 'react'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { ImageFieldView, ImageFieldViewProps } from '../../fieldViews'
import {
	FileUrlDataPopulator,
	GenericFileMetadataPopulator,
	GenericFileMetadataPopulatorProps,
	ImageFileMetadataPopulator,
	ImageFileMetadataPopulatorProps,
} from '../fileDataPopulators'
import { UploadField } from './UploadField'

export type ImageUploadFieldProps = SimpleRelativeSingleFieldProps &
	ImageFileMetadataPopulatorProps &
	GenericFileMetadataPopulatorProps & {
		formatPreviewUrl?: ImageFieldViewProps['formatUrl']
		previewAlt?: string
		previewTitle?: string
	}

export const ImageUploadField = Component<ImageUploadFieldProps>(
	props => (
		<UploadField
			{...props}
			fileUrlField={props.field}
			accept="image/*"
			fileDataPopulators={[
				new FileUrlDataPopulator({ fileUrlField: props.field }),
				new GenericFileMetadataPopulator(props),
				new ImageFileMetadataPopulator(props),
			]}
			renderFile={() => (
				<ImageFieldView
					srcField={props.field}
					formatUrl={props.formatPreviewUrl}
					alt={props.previewAlt}
					title={props.previewTitle}
				/>
			)}
			renderFilePreview={(file, previewUrl) => (
				<img src={previewUrl} alt={props.previewAlt} title={props.previewTitle} />
			)}
		/>
	),
	'ImageUploadField',
)
