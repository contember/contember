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

	export const Column: React.FunctionComponent<{}> = props => <ul className="dropdown-column">{props.children}</ul>

	export interface ItemProps {
		href?: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>['href']
		onClick?: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>['onClick']
		active?: boolean
	}

	export const Item: React.FunctionComponent<ItemProps> = props => (
		<li className="dropdown-item">
			<a className={cn('dropdown-link', props.active && 'is-active')} href={props.href} onClick={props.onClick}>
				{props.children}
			</a>
		</li>
	)
}

export { Dropdown }
