import * as React from 'react'
import { FieldName } from '../bindingTypes'
import DataBindingError from '../dao/DataBindingError'
import EntityAccessor from '../dao/EntityAccessor'
import FieldAccessor from '../dao/FieldAccessor'
import DataContext, { DataContextValue } from './DataContext'

export interface FieldProps {
	name: FieldName
	children?: (data: FieldAccessor) => React.ReactNode
}

export default class Field extends React.Component<FieldProps> {

	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const fieldData = data.data[this.props.name]

						if (this.props.children && fieldData instanceof FieldAccessor) {
							return this.props.children(fieldData)
						}
					}
					throw new DataBindingError('Corrupted data')
				}}
			</DataContext.Consumer>
		)
	}
}
