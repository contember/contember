import { dataAttribute } from '@contember/utilities'
import { memo, ReactElement, ReactNode, TextareaHTMLAttributes } from 'react'

export interface HTMLTextAreaDivTargetProps extends TextareaHTMLAttributes<HTMLDivElement> { }

export interface EditorCanvasProps<P extends HTMLTextAreaDivTargetProps> {
	underlyingComponent: (props: P) => ReactElement
	componentProps: P
	focusRing?: boolean
	children?: ReactNode
}

export const EditorCanvas = memo(<P extends HTMLTextAreaDivTargetProps>({
	children,
	focusRing = true,
	underlyingComponent: Component,
	componentProps: props,
}: EditorCanvasProps<P>) => {

	return (
		<div data-focus-ring={dataAttribute(focusRing)} className={'relative w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'}>
			<Component className="focus-visible:ring-0" {...props} />
			{children}
		</div>
	)
}) as {
	<P extends HTMLTextAreaDivTargetProps>(props: EditorCanvasProps<P>): ReactElement
	displayName?: string
}
EditorCanvas.displayName = 'EditorCanvas'
