import { useClassNameFactory } from '@contember/utilities'
import { CSSProperties, memo, ReactNode, useEffect, useRef, useState } from 'react'
import type { CollapsibleTransition } from '../../types'
import { forceReflow, toEnumStateClass, toEnumViewClass, toStateClass } from '../../utils'

export interface CollapsibleProps {
	expanded: boolean
	transition?: CollapsibleTransition
	children?: ReactNode
	onClose?: () => void
	onOpen?: () => void
	onTransitionEnd?: () => void
}

/**
 * @group UI
 */
export const Collapsible = memo((props: CollapsibleProps) => {
	const contentRef = useRef<HTMLDivElement>(null)
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [contentHeight, setContentHeight] = useState('auto')
	const [delayedExpanded, setDelayedExpanded] = useState(props.expanded)

	const onTransitionEnd = () => {
		if (!isTransitioning) {
			return
		}

		setContentHeight('auto')
		setIsTransitioning(false)
		props.onTransitionEnd?.()
		props.expanded ? props.onOpen?.() : props.onClose?.()
	}

	const updateContentHeight = () => {
		const contentHeight = `${contentRef.current!.getBoundingClientRect().height}px`
		setContentHeight(contentHeight)
	}

	useEffect(() => {
		let isMounted = true
		if (props.expanded !== delayedExpanded) {
			setIsTransitioning(true)
			updateContentHeight()
			requestAnimationFrame(() => {
				if (!isMounted) {
					return
				}
				forceReflow(contentRef.current!)
				setDelayedExpanded(props.expanded)
			})
		}
		return () => {
			isMounted = false
		}
	}, [delayedExpanded, props.expanded])

	const componentClassName = useClassNameFactory('collapsible')

	return (
		<div
			className={componentClassName(null, [
				toEnumViewClass(props.transition, 'topInsert'),
				toEnumStateClass(delayedExpanded ? 'expanded' : 'collapsed'),
				toStateClass('transitioning', isTransitioning),
			])}
			style={
				{
					'--cui-collapsible-content-height': contentHeight,
				} as CSSProperties // Custom properties not supported workaround
			}
			aria-hidden={!props.expanded}
			onTransitionEnd={onTransitionEnd}
		>
			<div className={componentClassName('content')} ref={contentRef}>
				{props.children}
			</div>
		</div>
	)
})
Collapsible.displayName = 'Collapsible'
