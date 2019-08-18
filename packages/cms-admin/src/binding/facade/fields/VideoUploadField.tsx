import * as React from 'react'
import { Field } from '../../coreComponents'
import { QueryLanguage } from '../../queryLanguage'
import { Component, SimpleRelativeSingleFieldProps } from '../auxiliary'
import { UploadField } from './UploadField'

export type VideoUploadFieldProps = SimpleRelativeSingleFieldProps

export const VideoUploadField = Component<VideoUploadFieldProps>(
	props => (
		<UploadField {...props} accept="video/*">
			{url => <video src={url} controls />}
		</UploadField>
	),
	(props, environment) =>
		QueryLanguage.wrapRelativeSingleField(props.name, fieldName => <Field name={fieldName} />, environment),
	'VideoUploadField',
)
