import { ErrorInfo, PureComponent } from 'react'
import { Portal } from '../Portal'
import { DevError } from './DevError'

export interface DevErrorBoundaryProps {}

interface DevErrorBoundaryState {
	caughtErrors: [Error, ErrorInfo][]
}

export class DevErrorBoundary extends PureComponent<DevErrorBoundaryProps, DevErrorBoundaryState> {
	state: DevErrorBoundaryState = {
		caughtErrors: [],
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({
			caughtErrors: [...this.state.caughtErrors, [error, errorInfo]],
		})
	}

	public render() {
		// TODO actually render all the errors
		// TODO detect when an error happens on mount
		const errorSlot =
			__DEV_MODE__ && this.state.caughtErrors.length ? (
				<Portal>
					<DevError error={this.state.caughtErrors[0][0]} stack={this.state.caughtErrors[0][1].componentStack} />
				</Portal>
			) : null

		if (__DEV_MODE__ && this.state.caughtErrors.length > 1) {
			return errorSlot
		}

		return (
			<>
				{this.props.children}
				{errorSlot}
			</>
		)
	}
}
