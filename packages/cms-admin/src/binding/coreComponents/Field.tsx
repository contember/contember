import * as React from 'react'
import { FieldName } from '../bindingTypes'
import DataBindingError from '../dao/DataBindingError'
import EntityAccessor from '../dao/EntityAccessor'
import FieldAccessor from '../dao/FieldAccessor'
import FieldMarker from '../dao/FieldMarker'
import PlaceholderGenerator from '../model/PlaceholderGenerator'
import DataContext, { DataContextValue } from './DataContext'
import { FieldMarkerProvider } from './MarkerProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'

export interface FieldProps {
	name: FieldName
	children?: (data: FieldAccessor<any>) => React.ReactNode
}

export default class Field extends React.Component<FieldProps> {
	public static displayName = 'Field'

	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const fieldData = data.data[PlaceholderGenerator.getFieldPlaceholder(this.props.name)]

						if (this.props.children && fieldData instanceof FieldAccessor) {
							return this.props.children(fieldData)
						}
					}
					throw new DataBindingError('Corrupted data')
				}}
			</DataContext.Consumer>
		)
	}

	public static generateFieldMarker(props: FieldProps): FieldMarker {
		return new FieldMarker(props.name)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Field, FieldMarkerProvider>
