import * as React from 'react'


export interface LoadingSpinnerProps {

}

export default class LoadingSpinner extends React.Component<LoadingSpinnerProps> {

	public render() {
		// TODO just hide the contents for the time being
		return <div style={{display: 'none'}}>
			{this.props.children}
		</div>
	}
}
