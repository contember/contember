import * as React from 'react'

class Table extends React.PureComponent {
	render() {
		return (
			<table className="table">
				<tbody>{this.props.children}</tbody>
			</table>
		)
	}
}

namespace Table {
	export class Row extends React.PureComponent {
		render() {
			return <tr className="table-row">{this.props.children}</tr>
		}
	}
	export class Cell extends React.PureComponent {
		render() {
			return <td className="table-cell">{this.props.children}</td>
		}
	}
}

export { Table }
