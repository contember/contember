import cn from 'classnames'
import type { ReactElement, ReactNode, TextareaHTMLAttributes } from 'react'
import { IncreaseBoxDepth, useClassNamePrefix } from '../../auxiliary'
import type { EditorCanvasSize, EditorCanvasDistinction } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface EditorCanvasProps<P extends TextareaHTMLAttributes<HTMLDivElement>> {
	underlyingComponent: (props: P) => ReactElement
	componentProps: P
	children?: ReactNode
	size?: EditorCanvasSize
	distinction?: EditorCanvasDistinction
}

// TODO add this to storybook
export const EditorCanvas = (<P extends TextareaHTMLAttributes<HTMLDivElement>>({
	children,
	size,
	distinction,
	underlyingComponent: Component,
	componentProps: props,
}: EditorCanvasProps<P>) => {
	const className = props.className
	const prefix = useClassNamePrefix()
	return (
		<div className={cn(`${prefix}editorCanvas`, toEnumViewClass(size), toEnumViewClass(distinction))}>
			<IncreaseBoxDepth currentDepth={1}>
				<Component {...props} className={cn(`${prefix}editorCanvas-canvas`, className)} />
			</IncreaseBoxDepth>
			{children}
		</div>
	)
}) as {
	<P extends TextareaHTMLAttributes<HTMLDivElement>>(props: EditorCanvasProps<P>): ReactElement
	displayName?: string
}
EditorCanvas.displayName = 'EditorCanvas'
