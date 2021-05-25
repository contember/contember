import cn from 'classnames'
import { CSSProperties, memo, ReactNode, useEffect, useRef, useState } from 'react'
import { useClassNamePrefix } from '../auxiliary'
import type { CollapsibleTransition } from '../types'
import { forceReflow, toEnumViewClass, toStateClass } from '../utils'

export interface CollapsibleProps {
	expanded: boolean
	transition?: CollapsibleTransition
	children?: ReactNode
	onTransitionEnd?: () => void
}

export const Collapsible = memo((props: CollapsibleProps) => {
	const contentRef = useRef<HTMLDivElement>(null)
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [contentHeight, setContentHeight] = useState('auto')
	const [delayedExpanded, setDelayedExpanded] = useState(props.expanded)

	const onTransitionEnd = () => {
		setContentHeight('auto')
		setIsTransitioning(false)
		props.onTransitionEnd?.()
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

	const prefix = useClassNamePrefix()

	return (
		<div
			className={cn(
				`${prefix}collapsible`,
				toEnumViewClass(props.transition, 'topInsert'),
				toStateClass('expanded', delayedExpanded),
				toStateClass('transitioning', isTransitioning),
			)}
			style={
				{
					'--cui-collapsible-content-height': contentHeight,
				} as CSSProperties // Custom properties not supported workaround
			}
			aria-hidden={!props.expanded}
			onTransitionEnd={onTransitionEnd}
		>
			<div className={`${prefix}collapsible-content`} ref={contentRef}>
				{props.children}
			</div>
		</div>
	)
})
Collapsible.displayName = 'Collapsible'
