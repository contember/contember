import * as React from 'react'
import EntityAccessor from '../dao/EntityAccessor'
import DataContext, { DataContextValue } from '../coreComponents/DataContext'

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
