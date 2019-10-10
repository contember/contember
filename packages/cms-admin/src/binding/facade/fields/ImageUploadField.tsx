import * as React from 'react'
import { Component } from '../../coreComponents'
import { QueryLanguage } from '../../queryLanguage'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { UploadField } from './UploadField'

export type ImageUploadFieldProps = SimpleRelativeSingleFieldProps

export const ImageUploadField = Component<ImageUploadFieldProps>(
	props => (
		<UploadField {...props} accept="image/*" emptyText={'No image'}>
			{url => <img src={url} />}
		</UploadField>
	),
	(props, environment) => QueryLanguage.wrapRelativeSingleField(props.name, environment),
	'ImageUploadField',
)
