import { Component } from '@contember/binding'
import * as React from 'react'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { VideoFieldView } from '../../fieldViews'
import {
	FileDataPopulator,
	FileUrlDataPopulator,
	GenericFileMetadataPopulator,
	GenericFileMetadataPopulatorProps,
	VideoFileMetadataPopulator,
	VideoFileMetadataPopulatorProps,
} from '../fileDataPopulators'
import { UploadField } from '../core'

export type VideoUploadFieldProps = SimpleRelativeSingleFieldProps &
	VideoFileMetadataPopulatorProps &
	GenericFileMetadataPopulatorProps & {
		additionalFileDataPopulators?: Iterable<FileDataPopulator>
	}

export const VideoUploadField = Component<VideoUploadFieldProps>(
	props => (
		<UploadField
			{...props}
			fileUrlField={props.field}
			accept="video/*"
			fileDataPopulators={[
				...(props.additionalFileDataPopulators || []),
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
