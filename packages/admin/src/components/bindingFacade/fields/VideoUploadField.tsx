import * as React from 'react'
import { Component, Field } from '@contember/binding'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { UploadField } from './UploadField'

export type VideoUploadFieldProps = SimpleRelativeSingleFieldProps

export const VideoUploadField = Component<VideoUploadFieldProps>(
	props => (
		<UploadField {...props} accept="video/*">
			{url => <video src={url} controls />}
		</UploadField>
	),
	props => <Field field={props.field} />,
	'VideoUploadField',
)
