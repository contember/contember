import * as React from 'react'
import { Component, Field } from '@contember/binding'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { VideoFileUploadProps } from '../VideoFileUploadProps'
import { GenericFileUploadProps } from '../GenericFileUploadProps'
import { UploadField } from './UploadField'

export type VideoUploadFieldProps = SimpleRelativeSingleFieldProps & GenericFileUploadProps & VideoFileUploadProps

export const VideoUploadField = Component<VideoUploadFieldProps>(
	props => (
		<UploadField {...props} accept="video/*">
			{url => <video src={url} controls />}
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
	'VideoUploadField',
)
