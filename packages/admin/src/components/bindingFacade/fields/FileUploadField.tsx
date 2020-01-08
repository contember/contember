import * as React from 'react'
import { Component, Field } from '@contember/binding'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { UploadField } from './UploadField'

export type FileUploadFieldProps = SimpleRelativeSingleFieldProps

// TODO this is super temporary
export const FileUploadField = Component<FileUploadFieldProps>(
	props => (
		<UploadField {...props} emptyText="No file selected">
			{url => (
				<span
					onClick={e => {
						e.stopPropagation()
					}}
					style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl' }}
				>
					<a href={url} target="_blank" rel="noopener">
						{url.substring(Math.max(0, url.lastIndexOf('/') + 1))}
					</a>
				</span>
			)}
		</UploadField>
	),
	props => <Field field={props.field} />,
	'FileUploadField',
)
