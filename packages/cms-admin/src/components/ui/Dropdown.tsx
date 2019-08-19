import * as React from 'react'
import cn from 'classnames'
import { useState } from 'react'
import { Collapsible } from '@contember/ui'

class Dropdown extends React.PureComponent<Dropdown.Props> {
	render() {
		return <ul className={cn('dropdown', this.props.columns && 'view-columns')}>{this.props.children}</ul>
	}
}

namespace Dropdown {
	export interface Props {
		columns?: boolean
	}

	export interface ColumnProps {
		children?: React.ReactNode
	}

	export const Column = (props: ColumnProps) => <ul className="dropdown-column">{props.children}</ul>

	export interface ItemProps {
		active?: boolean
		children?: React.ReactNode
	}

	export const Item = (props: ItemProps) => (
		<li className={cn('dropdown-item', props.active && 'is-active')}>{props.children}</li>
	)

	export interface RevealerProps {
		opener: any
		children?: React.ReactNode
	}

	export const Revealer = (props: RevealerProps) => {
		const [isRevealed, setIsRevealed] = useState(false)
		return (
			<div
				className="dropdown-revealer"
				onPointerEnter={() => setIsRevealed(true)}
				onPointerLeave={() => setIsRevealed(false)}
			>
				<div className="dropdown-revealer-opener" onClick={() => setIsRevealed(true)}>
					{props.opener}
				</div>
				<div className="dropdown-revealer-dropdown">
					<Collapsible expanded={isRevealed} transition="bottomInsert">
						{props.children}
					</Collapsible>
				</div>
			</div>
		)
	}
}

export { Dropdown }
