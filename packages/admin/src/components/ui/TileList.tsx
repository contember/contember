import { PureComponent } from 'react'

export class TileList extends PureComponent {
	render() {
		return <div className="tileList">{this.props.children}</div>
	}
}
