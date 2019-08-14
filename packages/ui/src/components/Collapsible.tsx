import * as React from 'react'
import cn from 'classnames'

export interface CollapsibleProps {
	expanded: boolean
	children?: React.ReactNode
}

export function Collapsible(props: CollapsibleProps) {
	const contentRef = React.useRef<HTMLDivElement>(null)
	const [contentHeight, setContentHeight] = React.useState('auto')
	const [delayedExpanded, setDelayedExpanded] = React.useState(props.expanded)

	const setContentHeightToAuto = () => {
		setContentHeight('auto')
	}

	const updateContentHeight = () => {
		const contentHeight = `${contentRef.current!.getBoundingClientRect().height}px`
		setContentHeight(contentHeight)
	}

	React.useEffect(() => {
		if (props.expanded !== delayedExpanded) {
			updateContentHeight()
			requestAnimationFrame(() => {
				contentRef.current!.clientHeight // Force reflow
				setDelayedExpanded(props.expanded)
			})
		}
	}, [delayedExpanded, props.expanded])

	return (
		<div
			className={cn('collapsible', delayedExpanded && 'is-expanded')}
			style={
				{
					'--content-height': contentHeight,
				} as React.CSSProperties // Custom properties not supported workaround
			}
			aria-hidden={!props.expanded}
			onTransitionEnd={setContentHeightToAuto}
		>
			<div className="collapsible-content" ref={contentRef}>
				{props.children}
			</div>
		</div>
	)
}
