import { ScrollTargetElement } from '@contember/react-slate-editor-base'
import type { FunctionComponent } from 'react'
import { RenderElementProps, useSelected } from 'slate-react'

export interface ScrollTargetRendererProps extends Omit<RenderElementProps, 'element'> {
	element: ScrollTargetElement
}

export const ScrollTargetRenderer: FunctionComponent<ScrollTargetRendererProps> = (
	props: ScrollTargetRendererProps,
) => {
	const isSelected = useSelected()
	return (
		<span
			{...props.attributes}
			title={props.element.identifier}
			style={{
				display: 'inline-block',
				color: '#E0E0E0',
				boxShadow: isSelected ? '0 0 0 0.2em rgba(0, 148, 255, 0.3)' : 'none',
				fontSize: '.8em',
				margin: '0 -.05em',
			}}
		>
			<span contentEditable={false}>#</span>
			{props.children}
		</span>
	)
}
ScrollTargetRenderer.displayName = 'ScrollTargetRenderer'
