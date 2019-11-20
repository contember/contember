import * as React from 'react'
import {
	EnforceSubtypeRelation,
	EntityListDataProvider,
	Environment,
	Field,
	PRIMARY_KEY_NAME,
	QueryLanguage,
	SyntheticChildrenProvider,
	ToMany,
	ToOne,
} from '../../../../binding'
import { ChoiceFieldData } from './ChoiceFieldData'
import { DynamicChoiceField, DynamicChoiceFieldProps } from './DynamicChoiceField'
import { StaticChoiceField, StaticChoiceFieldProps } from './StaticChoiceField'

export type ChoiceFieldProps = ChoiceFieldData.BaseProps & {
	options: StaticChoiceFieldProps['options'] | DynamicChoiceFieldProps['options']
}

class ChoiceField extends React.PureComponent<ChoiceFieldProps> {
	public static displayName = 'ChoiceField'

	public render() {
		return (
			<Field.DataRetriever name={this.props.name}>
				{rawMetadata => {
					// Unfortunately, the "any" type is necessary because the TS inference otherwise fails here for some reason.
					const commonProps: any = {
						...rawMetadata,
						name: this.props.name,
						options: this.props.options,
						arity: this.props.arity,
						children: this.props.children,
						renderOptionText: this.props.renderOptionText,
						optionFieldStaticFactory: this.props.optionFieldStaticFactory,
					}

					if (Array.isArray(this.props.options)) {
						return <StaticChoiceField {...commonProps} />
					}
					return <DynamicChoiceField {...commonProps} />
				}}
			</Field.DataRetriever>
		)
	}

	public static generateSyntheticChildren(
		props: Omit<ChoiceFieldProps, 'children'>,
		environment: Environment,
	): React.ReactNode {
		if (Array.isArray(props.options)) {
			return QueryLanguage.wrapRelativeSingleField(props.name, environment)
		}

		const metadata:
			| QueryLanguage.WrappedQualifiedEntityList
			| QueryLanguage.WrappedQualifiedFieldList = props.optionFieldStaticFactory
			? QueryLanguage.wrapQualifiedEntityList(props.options, props.optionFieldStaticFactory, environment)
			: QueryLanguage.wrapQualifiedFieldList(props.options, fieldName => <Field name={fieldName} />, environment)

		return QueryLanguage.wrapRelativeSingleField(props.name, environment, fieldName => (
			<>
				<EntityListDataProvider entityName={metadata.entityName} filter={metadata.filter} associatedField={props.name}>
					{metadata.children}
				</EntityListDataProvider>
				{props.arity === ChoiceFieldData.ChoiceArity.Single && (
					<ToOne field={fieldName}>
						<Field name={PRIMARY_KEY_NAME} />
					</ToOne>
				)}
				{props.arity === ChoiceFieldData.ChoiceArity.Multiple && (
					<ToMany field={fieldName}>
						<Field name={PRIMARY_KEY_NAME} />
					</ToMany>
				)}
			</>
		))
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof ChoiceField,
	SyntheticChildrenProvider<ChoiceFieldProps>
>

export { ChoiceField }
