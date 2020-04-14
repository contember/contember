import { Component } from '@contember/binding'
import * as React from 'react'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { VideoFieldView } from '../../fieldViews'
import {
	FileUrlDataPopulator,
	GenericFileMetadataPopulator,
	GenericFileMetadataPopulatorProps,
	VideoFileMetadataPopulator,
	VideoFileMetadataPopulatorProps,
} from '../fileDataPopulators'
import { UploadField } from './UploadField'

export type VideoUploadFieldProps = SimpleRelativeSingleFieldProps &
	VideoFileMetadataPopulatorProps &
	GenericFileMetadataPopulatorProps

export const VideoUploadField = Component<VideoUploadFieldProps>(
	props => (
		<UploadField
			{...props}
			fileUrlField={props.field}
			accept="video/*"
			fileDataPopulators={[
				new FileUrlDataPopulator({ fileUrlField: props.field }),
				new GenericFileMetadataPopulator(props),
				new VideoFileMetadataPopulator(props),
			]}
			renderFile={() => <VideoFieldView srcField={props.field} />}
			renderFilePreview={(file, previewUrl) => <video src={previewUrl} controls />}
		/>
	),
	'VideoUploadField',
)
