import { useClassNameFactory } from '@contember/utilities'
import { memo, ReactElement, ReactNode, TextareaHTMLAttributes, useEffect, useRef, useState } from 'react'
import type { EditorCanvasDistinction, EditorCanvasSize } from '../../types'
import { toEnumStateClass, toEnumViewClass } from '../../utils'

export interface HTMLTextAreaDivTargetProps extends TextareaHTMLAttributes<HTMLDivElement> { }

export interface EditorCanvasProps<P extends HTMLTextAreaDivTargetProps> {
	underlyingComponent: (props: P) => ReactElement
	componentProps: P
	children?: ReactNode
	size?: EditorCanvasSize
	distinction?: EditorCanvasDistinction
	inset?: 'hovering-toolbar'
}

// Approximation: Toolbar height + vertical margin
const toolbarVisibilityTreshold = 56 + 2 * 16

export const EditorCanvas = memo(<P extends HTMLTextAreaDivTargetProps>({
	children,
	inset,
	size,
	distinction,
	underlyingComponent: Component,
	componentProps: props,
}: EditorCanvasProps<P>) => {
	const className = props.className
	const componentClassName = useClassNameFactory('editorCanvas')

	const [isInView, setIsInView] = useState(false)

	const intersectionRef = useRef<HTMLDivElement>(null)
	const observer = useRef(new IntersectionObserver(entries => {
		entries.forEach(({ isIntersecting }) => {
			setIsInView(isIntersecting)
		})
	}, {
		rootMargin: `-${toolbarVisibilityTreshold}px 0px -${toolbarVisibilityTreshold}px 0px`,
	}))

	useEffect(() => {
		const intersectionObserver = observer.current

		if (intersectionRef.current) {
			intersectionObserver.observe(intersectionRef.current)
		}

		return () => {
			intersectionObserver.disconnect()
		}
	}, [])

	return (
		<div ref={intersectionRef} className={componentClassName(null, [
			toEnumViewClass(size),
			toEnumViewClass(inset),
			toEnumViewClass(distinction),
			toEnumStateClass(isInView ? 'in-view' : 'not-in-view'),
		])}>
			<Component {...props} className={componentClassName('canvas', className)} />
			{children}
		</div>
	)
}) as {
	<P extends HTMLTextAreaDivTargetProps>(props: EditorCanvasProps<P>): ReactElement
	displayName?: string
}
EditorCanvas.displayName = 'EditorCanvas'
