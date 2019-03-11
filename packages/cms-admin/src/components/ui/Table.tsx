import * as React from 'react'
import cn from 'classnames'

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
	export class Row extends React.PureComponent<React.HTMLAttributes<HTMLTableRowElement>> {
		render() {
			const props = this.props
			return (
				<tr {...props} className={cn(props.className, 'table-row')}>
					{this.props.children}
				</tr>
			)
		}
	}

	export class Cell extends React.PureComponent {
		render() {
			return <td className="table-cell">{this.props.children}</td>
		}
	}
}

export { Table }
