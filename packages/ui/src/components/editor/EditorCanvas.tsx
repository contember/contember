import cn from 'classnames'
import * as React from 'react'
import { IncreaseBoxDepth, useClassNamePrefix } from '../../auxiliary'
import { EditorCanvasSize } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface EditorCanvasProps<P extends React.TextareaHTMLAttributes<HTMLDivElement>> {
	underlyingComponent: (props: P) => React.ReactElement
	componentProps: P
	children?: React.ReactNode
	size?: EditorCanvasSize
}

// TODO add this to storybook
export const EditorCanvas = (<P extends React.TextareaHTMLAttributes<HTMLDivElement>>({
	children,
	size,
	underlyingComponent: Component,
	componentProps: props,
}: EditorCanvasProps<P>) => {
	const className = props.className
	const prefix = useClassNamePrefix()
	return (
		<div className={cn(`${prefix}editorCanvas`, toEnumViewClass(size))}>
			<IncreaseBoxDepth currentDepth={1}>
				<Component {...props} className={cn(`${prefix}editorCanvas-canvas`, className)} />
			</IncreaseBoxDepth>
			{children}
		</div>
	)
}) as {
	<P extends React.TextareaHTMLAttributes<HTMLDivElement>>(props: EditorCanvasProps<P>): React.ReactElement
	displayName?: string
}
EditorCanvas.displayName = 'EditorCanvas'
