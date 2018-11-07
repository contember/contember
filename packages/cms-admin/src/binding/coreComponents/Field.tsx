import * as React from 'react'
import { FieldName } from '../bindingTypes'
import {
	DataBindingError,
	EntityAccessor,
	EntityForRemovalAccessor,
	Environment,
	FieldAccessor,
	FieldMarker
} from '../dao'
import { Parser } from '../queryLanguage'
import { DataContext, DataContextValue } from './DataContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { FieldMarkerProvider } from './MarkerProvider'

export interface FieldProps {
	name: FieldName
	children?: (data: FieldAccessor<any>, environment: Environment) => React.ReactNode
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
											return (
												<Field.FieldInner accessor={fieldData} environment={environment}>
													{this.props.children}
												</Field.FieldInner>
											)
										}
									} else if (data instanceof EntityForRemovalAccessor) {
										// Do nothing
									} else {
										throw new DataBindingError('Corrupted data')
									}
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
		environment: Environment
		children: Exclude<FieldProps['children'], undefined>
	}

	export class FieldInner extends React.PureComponent<FieldInnerProps> {
		public render() {
			return this.props.children(this.props.accessor, this.props.environment)
		}
	}
}

export { Field }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Field, FieldMarkerProvider<FieldProps>>
