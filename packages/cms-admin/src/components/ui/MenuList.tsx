import * as React from 'react'

export interface MenuListProps {
	title?: string
}

export class MenuList extends React.PureComponent<MenuListProps> {
	render() {
		return (
			<ul className="menu-list">
				{this.props.title && <h3 className="menu-title">{this.props.title}</h3>}

				{this.props.children}
			</ul>
		)
	}
}
