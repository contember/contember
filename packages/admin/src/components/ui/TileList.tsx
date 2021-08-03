import { PureComponent } from 'react'

export class TileList extends PureComponent {
	override render() {
		return <div className="tileList">{this.props.children}</div>
	}
}
