import { Component } from '@contember/binding'
import * as React from 'react'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { ImageFieldView } from '../../fieldViews'
import { GenericFileUploadProps } from '../GenericFileUploadProps'
import { ImageFileUploadProps } from '../ImageFileUploadProps'
import { UploadField } from './UploadField'

export type ImageUploadFieldProps = SimpleRelativeSingleFieldProps & ImageFileUploadProps & GenericFileUploadProps

export const ImageUploadField = Component<ImageUploadFieldProps>(
	props => (
		<UploadField
			{...props}
			fileUrlField={props.field}
			accept="image/*"
			emptyText={'No image'}
			renderFile={() => <ImageFieldView srcField={props.field} />}
			renderFilePreview={(file, previewUrl) => <img src={previewUrl} />}
		/>
	),
	'ImageUploadField',
)
