import * as React from 'react'
import { Component, Field } from '@contember/binding'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { GenericFileUploadProps } from '../GenericFileUploadProps'
import { ImageFileUploadProps } from '../ImageFileUploadProps'
import { UploadField } from './UploadField'

export type ImageUploadFieldProps = SimpleRelativeSingleFieldProps & ImageFileUploadProps & GenericFileUploadProps

export const ImageUploadField = Component<ImageUploadFieldProps>(
	props => (
		<UploadField {...props} accept="image/*" emptyText={'No image'}>
			{url => <img src={url} />}
		</UploadField>
	),
	(props, environment) =>
		UploadField.generateSyntheticChildren(
			{
				...props,
				children: () => null,
			},
			environment,
		),
	'ImageUploadField',
)
