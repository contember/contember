import { Component } from '@contember/binding'
import * as React from 'react'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { ImageFieldView } from '../../fieldViews'
import {
	FileUrlDataPopulator,
	GenericFileMetadataPopulator,
	GenericFileMetadataPopulatorProps,
	ImageFileMetadataPopulator,
	ImageFileMetadataPopulatorProps,
} from '../fileDataPopulators'
import { getIsFieldFilled } from './getIsFieldFilled'
import { UploadField } from './UploadField'

export type ImageUploadFieldProps = SimpleRelativeSingleFieldProps &
	ImageFileMetadataPopulatorProps &
	GenericFileMetadataPopulatorProps

export const ImageUploadField = Component<ImageUploadFieldProps>(
	props => (
		<UploadField
			{...props}
			fileUrlField={props.field}
			hasPersistedFile={getIsFieldFilled(props.field)}
			accept="image/*"
			fileDataPopulators={[
				new FileUrlDataPopulator({ fileUrlField: props.field }),
				new GenericFileMetadataPopulator(props),
				new ImageFileMetadataPopulator(props),
			]}
			renderFile={() => <ImageFieldView srcField={props.field} />}
			renderFilePreview={(file, previewUrl) => <img src={previewUrl} />}
		/>
	),
	'ImageUploadField',
)
