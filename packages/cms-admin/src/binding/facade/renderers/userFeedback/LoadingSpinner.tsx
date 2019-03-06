import * as React from 'react'
import { Spinner } from '../../../../components'

export class LoadingSpinner extends React.Component<{}> {
	public render() {
		return (
			<div className="loadingSpinner">
				<Spinner />
			</div>
		)
	}
}
