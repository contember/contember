import * as React from 'react'
import { FieldName, Scalar, VariableInput } from '../bindingTypes'
import {
	DataBindingError,
	EntityAccessor,
	EntityForRemovalAccessor,
	Environment,
	FieldAccessor,
	FieldMarker
} from '../dao'
import { VariableInputTransformer } from '../model/VariableInputTransformer'
import { QueryLanguage } from '../queryLanguage/QueryLanguage'
import { DataContext, DataContextValue } from './DataContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { EnvironmentContext } from './EnvironmentContext'
import { FieldMarkerProvider } from './MarkerProvider'

export interface FieldPublicProps {
	name: FieldName
	defaultValue?: VariableInput | Scalar
}

export interface FieldProps extends FieldPublicProps {
	children?: (data: FieldAccessor<any>, environment: Environment) => React.ReactNode
}

class Field extends React.PureComponent<FieldProps> {
	public static displayName = 'Field'

	public render() {
		return (
			<Field.DataRetriever name={this.props.name}>
				{(fieldName, data, environment) => {
					if (data instanceof EntityAccessor) {
						const fieldData = data.data.getField(fieldName)

						if (this.props.children && fieldData instanceof FieldAccessor) {
							return (
								<Field.FieldInner accessor={fieldData} environment={environment}>
									{this.props.children}
								</Field.FieldInner>
							)
						} else {
							throw new DataBindingError(`Undefined field '${fieldName}'`)
						}
					} else if (data instanceof EntityForRemovalAccessor) {
						// Do nothing
					} else {
						throw new DataBindingError('Corrupted data')
					}
				}}
			</Field.DataRetriever>
		)
	}

	public static generateFieldMarker(props: FieldProps, environment: Environment): FieldMarker {
		return new FieldMarker(
			props.name,
			props.defaultValue && VariableInputTransformer.transformValue(props.defaultValue, environment)
		)
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

	export interface DataRetrieverProps {
		name: FieldName
		children: (fieldName: FieldName, data: DataContextValue, environment: Environment) => React.ReactNode
	}

	export class DataRetriever extends React.Component<DataRetrieverProps> {
		public render() {
			return (
				<EnvironmentContext.Consumer>
					{environment =>
						QueryLanguage.wrapRelativeSingleField(
							this.props.name,
							fieldName => (
								<DataContext.Consumer>
									{(data: DataContextValue) => this.props.children(fieldName, data, environment)}
								</DataContext.Consumer>
							),
							environment
						)
					}
				</EnvironmentContext.Consumer>
			)
		}
	}
}

export { Field }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Field, FieldMarkerProvider<FieldProps>>
