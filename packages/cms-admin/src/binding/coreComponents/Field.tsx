import * as React from 'react'
import { FieldName } from '../bindingTypes'
import DataBindingError from '../dao/DataBindingError'
import EntityAccessor from '../dao/EntityAccessor'
import FieldAccessor from '../dao/FieldAccessor'
import FieldMarker from '../dao/FieldMarker'
import Parser from '../queryLanguage/Parser'
import DataContext, { DataContextValue } from './DataContext'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'
import EnvironmentContext from './EnvironmentContext'
import { FieldMarkerProvider } from './MarkerProvider'

export interface FieldProps {
	name: FieldName
	children?: (data: FieldAccessor<any>) => React.ReactNode
}

class Field extends React.Component<FieldProps> {
	public static displayName = 'Field'

	public render() {
		return (
			<EnvironmentContext.Consumer>
				{environment =>
					Parser.generateWrappedField(
						this.props.name,
						fieldName => (
							<DataContext.Consumer>
								{(data: DataContextValue) => {
									if (data instanceof EntityAccessor) {
										const fieldData = data.data.getField(fieldName)

										if (this.props.children && fieldData instanceof FieldAccessor) {
											return <Field.FieldInner accessor={fieldData}>{this.props.children}</Field.FieldInner>
										}
									}
									throw new DataBindingError('Corrupted data')
								}}
							</DataContext.Consumer>
						),
						environment
					)
				}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateFieldMarker(props: FieldProps): FieldMarker {
		return new FieldMarker(props.name)
	}
}

namespace Field {
	export interface FieldInnerProps {
		accessor: FieldAccessor
		children: (data: FieldAccessor<any>) => React.ReactNode
	}

	export class FieldInner extends React.PureComponent<FieldInnerProps> {
		public render() {
			return this.props.children(this.props.accessor)
		}
	}
}

export default Field

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Field, FieldMarkerProvider>
