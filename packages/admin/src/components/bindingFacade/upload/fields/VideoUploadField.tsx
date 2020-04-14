import * as React from 'react'
import { Component, Field } from '@contember/binding'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { VideoFieldView } from '../../fieldViews'
import { VideoFileUploadProps } from '../VideoFileUploadProps'
import { GenericFileUploadProps } from '../GenericFileUploadProps'
import { UploadField } from './UploadField'

export type VideoUploadFieldProps = SimpleRelativeSingleFieldProps & GenericFileUploadProps & VideoFileUploadProps

export const VideoUploadField = Component<VideoUploadFieldProps>(
	props => (
		<UploadField
			{...props}
			fileUrlField={props.field}
			accept="video/*"
			renderFile={() => <VideoFieldView srcField={props.field} />}
			renderFilePreview={(file, previewUrl) => <video src={previewUrl} controls />}
		/>
	),
	'VideoUploadField',
)
