import * as React from 'react'
import { Portal } from '../Portal'
import { DevError } from './DevError'

export interface DevErrorBoundaryProps {}

interface DevErrorBoundaryState {
	caughtError?: [Error, React.ErrorInfo]
}

export class DevErrorBoundary extends React.PureComponent<DevErrorBoundaryProps, DevErrorBoundaryState> {
	state: DevErrorBoundaryState = {
		caughtError: undefined,
	}

	public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.setState({
			caughtError: [error, errorInfo],
		})
	}

	public render() {
		const errorSlot =
			__DEV_MODE__ && this.state.caughtError ? (
				<Portal>
					<DevError error={this.state.caughtError[0]} stack={this.state.caughtError[1].componentStack} />
				</Portal>
			) : null

		return (
			<>
				{this.props.children}
				{errorSlot}
			</>
		)
	}
}
