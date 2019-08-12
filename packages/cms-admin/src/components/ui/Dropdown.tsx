import * as React from 'react'
import cn from 'classnames'

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

	export const Revealer = (props: RevealerProps) => (
		<div className="dropdown-revealer">
			<div className="dropdown-revealer-opener">{props.opener}</div>
			<div className="dropdown-revealer-dropdown">{props.children}</div>
		</div>
	)
}

export { Dropdown }
