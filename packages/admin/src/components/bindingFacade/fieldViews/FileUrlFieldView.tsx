import { Component, SugaredField, SugaredFieldProps, useField } from '@contember/binding'
import type { AnchorHTMLAttributes, FunctionComponent } from 'react'

export interface FileUrlFieldViewProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
	fileUrlField: SugaredFieldProps['field']
}

export const FileUrlFieldView: FunctionComponent<FileUrlFieldViewProps> = Component(
	({ fileUrlField, ...props }) => {
		const fieldAccessor = useField<string>(fileUrlField)
		const url = fieldAccessor.value!
		return (
			<a
				style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl' }}
				href={url}
				target="_blank"
				rel="noopener"
				{...props}
			>
				{url.substring(Math.max(0, url.lastIndexOf('/') + 1))}
			</a>
		)
	},
	props => <SugaredField field={props.fileUrlField} />,
	'FileUrlFieldView',
)
