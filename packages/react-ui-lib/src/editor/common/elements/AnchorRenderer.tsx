import { AnchorElement } from '@contember/react-slate-editor-base'
import type { FunctionComponent, MouseEvent as ReactMouseEvent } from 'react'
import type { RenderElementProps } from 'slate-react'
import { LinkIcon } from 'lucide-react'

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

export const AnchorRenderer: FunctionComponent<AnchorRendererProps> = (props: AnchorRendererProps) => (<span className="inline-flex gap-1 items-center">
	<span className="bg-gray-50 border-b border-b-blue-300">
		{props.children}
	</span>
	<a
		{...props.attributes}
		href={props.element.href}
		title={props.element.href}
		target="_blank"
		rel="noopener noreferrer"
		onClickCapture={onClick}
		style={style}
		contentEditable={false}
	>
		<LinkIcon className="w-3 h-3" />
	</a>
</span>)
AnchorRenderer.displayName = 'AnchorRenderer'
