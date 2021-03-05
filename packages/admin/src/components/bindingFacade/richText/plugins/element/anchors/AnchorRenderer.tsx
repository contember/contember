import { FunctionComponent, MouseEvent as ReactMouseEvent } from 'react'
import { RenderElementProps } from 'slate-react'
import { AnchorElement } from './AnchorElement'

export interface AnchorRendererProps extends Omit<RenderElementProps, 'element'> {
	element: AnchorElement
}

const onClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
	// I cannot believe this works.
	window.open(e.currentTarget.href, '_blank')
}

const style = {
	cursor: 'pointer',
} as const

export const AnchorRenderer: FunctionComponent<AnchorRendererProps> = (props: AnchorRendererProps) => (
	<a
		{...props.attributes}
		href={props.element.href}
		title={props.element.href}
		target="_blank"
		onClickCapture={onClick}
		style={style}
	>
		{props.children}
	</a>
)
AnchorRenderer.displayName = 'AnchorRenderer'
