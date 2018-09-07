import * as React from 'react'

export default class MenuList extends React.Component {
	render() {
		return <div className="menu">{this.props.children}</div>
	}
}
