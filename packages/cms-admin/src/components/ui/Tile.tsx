import * as React from 'react'

export class Tile extends React.PureComponent {
	render() {
		return <section className="tile">{this.props.children}</section>
	}
}
