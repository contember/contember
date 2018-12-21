import { Intent, ISpinnerProps, Spinner as BPSpinner, Spinner } from '@blueprintjs/core'
import * as React from 'react'

export interface LoadingSpinnerProps extends ISpinnerProps {}

export class LoadingSpinner extends React.Component<LoadingSpinnerProps> {
	public render() {
		return <Spinner intent={Intent.PRIMARY} size={BPSpinner.SIZE_LARGE} {...this.props} className="loadingSpinner" />
	}
}
