import { TableRowElement } from '@contember/react-slate-editor-base'
import { memo } from 'react'
import type { RenderElementProps } from 'slate-react'

export interface TableRowElementRendererProps extends Omit<RenderElementProps, 'element'> {
	element: TableRowElement
}

export const TableRowElementRenderer = memo(function TableRowElementRenderer(props: TableRowElementRendererProps) {
	return (
		<tr {...props.attributes} /* headerScope={props.element.headerScope}*/>
			{props.children}
		</tr>
	)
})
