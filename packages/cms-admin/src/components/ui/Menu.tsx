import * as React from 'react'

export class Menu extends React.PureComponent {
	render() {
		return <div className="menu">{this.props.children}</div>
	}
}
