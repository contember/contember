import * as React from 'react'
import { Component } from '../../coreComponents'
import { QueryLanguage } from '../../queryLanguage'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { UploadField } from './UploadField'

export type VideoUploadFieldProps = SimpleRelativeSingleFieldProps

export const VideoUploadField = Component<VideoUploadFieldProps>(
	props => (
		<UploadField {...props} accept="video/*">
			{url => <video src={url} controls />}
		</UploadField>
	),
	(props, environment) => QueryLanguage.wrapRelativeSingleField(props.name, environment),
	'VideoUploadField',
)
