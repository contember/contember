import { Component, SugaredField, SugaredFieldProps, useField } from '@contember/react-binding'
import type { FunctionComponent } from 'react'
import { HTMLAnchorElementProps } from '@contember/ui'

export type FileUrlFieldViewProps =
	& {
		fileUrlField: SugaredFieldProps['field']
	}
	& HTMLAnchorElementProps

/**
 * @group Field Views
 */
export const FileUrlFieldView: FunctionComponent<FileUrlFieldViewProps> = Component(
	({ fileUrlField, ...props }) => {
		const fieldAccessor = useField<string>(fileUrlField)
		const url = fieldAccessor.value!
		return (
			<a
				style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl' }}
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				{...props}
			>
				{url.substring(Math.max(0, url.lastIndexOf('/') + 1))}
			</a>
		)
	},
	props => <SugaredField field={props.fileUrlField} />,
	'FileUrlFieldView',
)
