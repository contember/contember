import * as React from 'react'

export default class MenuList extends React.Component<MenuListProps> {
	render() {
		return (
			<ul className="menu-list">
				{this.props.title && <h3 className="menu-title">{this.props.title}</h3>}

				{this.props.children}
			</ul>
		)
	}
}

export interface MenuListProps {
	title?: string
}
