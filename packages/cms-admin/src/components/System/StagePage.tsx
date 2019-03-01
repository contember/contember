import * as React from 'react'
import DiffView from './DiffView'
import DiffDialog from './DiffDialog'

export default class StagePage extends React.PureComponent {
	render() {
		return (
			<>
				<DiffDialog />
				<DiffView />
			</>
		)
	}
}
