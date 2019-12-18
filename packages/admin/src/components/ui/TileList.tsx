import * as React from 'react'

export class TileList extends React.PureComponent {
	render() {
		return <div className="tileList">{this.props.children}</div>
	}
}
