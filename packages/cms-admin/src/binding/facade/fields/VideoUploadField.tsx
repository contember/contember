import * as React from 'react'
import { FormGroupProps } from '../../../components/ui'
import { FieldName } from '../../bindingTypes'
import { SimpleRelativeSingleField } from '../auxiliary'
import { UploadField } from './UploadField'

export interface VideoUploadFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
}

export const VideoUploadField = SimpleRelativeSingleField<VideoUploadFieldProps>(
	props => (
		<UploadField name={props.name} accept="video/*">
			{url => <video src={url} controls />}
		</UploadField>
	),
	'VideoUploadField',
)
