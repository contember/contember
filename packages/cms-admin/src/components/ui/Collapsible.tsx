import * as React from 'react'
import cn from 'classnames'
import { createRef } from 'react'

export interface CollapsibleProps {
	expanded: boolean
}

interface CollapsibleState {
	targetHeight: string
	delayedExpanded: boolean
}

export class Collapsible extends React.Component<CollapsibleProps> {
	protected contentRef = createRef<HTMLDivElement>()

	state: CollapsibleState = {
		targetHeight: 'auto',
		delayedExpanded: this.props.expanded,
	}

	componentWillReceiveProps(nextProps: Readonly<CollapsibleProps>): void {
		if (nextProps.expanded !== this.props.expanded) {
			this.updateTargetHeight(() => {
				setTimeout(() => {
					this.setState({
						delayedExpanded: nextProps.expanded,
					})
				}, 50)
			})
		}
	}

	render() {
		const { expanded } = this.props
		const { delayedExpanded, targetHeight } = this.state

		return (
			<div
				className={cn('collapsible', delayedExpanded && 'is-expanded')}
				style={
					{
						'--target-height': targetHeight,
					} as React.CSSProperties // Custom properties not supported workaround
				}
				aria-hidden={!expanded}
				onTransitionEnd={this.setTargetHeightToAuto}
			>
				<div className="collapsible-content" ref={this.contentRef}>
					{this.props.children}
				</div>
			</div>
		)
	}

	protected setTargetHeightToAuto = () => {
		this.setState({ targetHeight: 'auto' })
	}

	protected updateTargetHeight(callback?: () => void) {
		const targetHeight = `${this.contentRef.current!.getBoundingClientRect().height}px`
		this.setState({ targetHeight }, callback)
	}
}
