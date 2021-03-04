import * as React from 'react'
import * as ReactDOM from 'react-dom'

export class Portal extends React.PureComponent {
	private el = document.createElement('div')

	componentDidMount() {
		document.body.appendChild(this.el)
	}

	componentWillUnmount() {
		document.body.removeChild(this.el)
	}

	render(): React.ReactElement {
		return ReactDOM.createPortal(this.props.children, this.el)
	}
}
