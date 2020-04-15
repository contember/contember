import { Component } from '@contember/binding'
import * as React from 'react'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { FileUrlFieldView } from '../../fieldViews'
import {
	FileUrlDataPopulator,
	GenericFileMetadataPopulator,
	GenericFileMetadataPopulatorProps,
} from '../fileDataPopulators'
import { UploadField } from './UploadField'

export type FileUploadFieldProps = SimpleRelativeSingleFieldProps & GenericFileMetadataPopulatorProps

// TODO this is super temporary
export const FileUploadField = Component<FileUploadFieldProps>(
	props => (
		<UploadField
			{...props}
			fileUrlField={props.field}
			fileDataPopulators={[
				new FileUrlDataPopulator({ fileUrlField: props.field }),
				new GenericFileMetadataPopulator(props),
			]}
			renderFilePreview={(file, previewUrl) => (
				<a
					style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl' }}
					href={previewUrl}
					target="_blank"
					rel="noopener"
				>
					{previewUrl.substring(Math.max(0, previewUrl.lastIndexOf('/') + 1))}
				</a>
			)}
			renderFile={() => <FileUrlFieldView fileUrlField={props.field} />}
		/>
	),
	'FileUploadField',
)
