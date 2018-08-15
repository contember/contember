import * as React from 'react'

interface RenderPromiseProps {
	children: Promise<React.ReactNode>
}

interface RenderPromiseState {
	node: React.ReactNode
}

export default class RenderPromise extends React.Component<RenderPromiseProps, RenderPromiseState> {
	state = {
		node: null
	}

	componentDidMount() {
		this.hasNewPromise()
	}

	componentDidUpdate(prevProps: RenderPromiseProps) {
		if (this.props.children !== prevProps.children) this.hasNewPromise()
	}

	hasNewPromise() {
		const newPromise = this.props.children
		this.setState({ node: null })
		newPromise.then(node => {
			this.setState(() => {
				if (this.props.children === newPromise) return { node }
			})
		})
	}

	render() {
		return this.state.node
	}
}
