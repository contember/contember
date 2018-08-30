import * as React from 'react'
import DataContext, { DataContextValue } from '../coreComponents/DataContext'
import EntityAccessor from '../dao/EntityAccessor'

export default class UnlinkButton extends React.Component {
	public render() {
		return (
			<DataContext.Consumer>
				{(value: DataContextValue) => {
					if (value instanceof EntityAccessor) {
						return (
							<button type="button" onClick={value.unlink}>
								×
							</button>
						)
					}
				}}
			</DataContext.Consumer>
		)
	}
}
