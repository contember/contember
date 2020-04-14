import { Component } from '@contember/binding'
import * as React from 'react'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { FileUrlFieldView } from '../../fieldViews'
import { GenericFileUploadProps } from '../GenericFileUploadProps'
import { UploadField } from './UploadField'

export type FileUploadFieldProps = SimpleRelativeSingleFieldProps & GenericFileUploadProps

// TODO this is super temporary
export const FileUploadField = Component<FileUploadFieldProps>(
	props => (
		<UploadField
			{...props}
			fileUrlField={props.field}
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
			emptyText="No file selected"
		/>
	),
	'FileUploadField',
)
