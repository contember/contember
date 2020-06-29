import {
	BindingError,
	Component,
	Environment,
	Field,
	FieldValue,
	OptionallyVariableFieldValue,
	SugaredRelativeSingleField,
	useEnvironment,
	useMutationState,
	useRelativeSingleField,
	VariableInputTransformer,
} from '@contember/binding'
import * as React from 'react'
import { ChoiceFieldData } from './ChoiceFieldData'

export interface StaticOption {
	label: React.ReactNode
	description?: React.ReactNode
}

export interface NormalizedStaticOption extends StaticOption {
	value: FieldValue
}

export interface OptionallyVariableStaticOption extends StaticOption {
	value: OptionallyVariableFieldValue
}

export interface StaticChoiceFieldProps<Arity extends ChoiceFieldData.ChoiceArity = ChoiceFieldData.ChoiceArity>
	extends SugaredRelativeSingleField {
	options: OptionallyVariableStaticOption[]
	arity: Arity
}

const normalizeOptions = (options: OptionallyVariableStaticOption[], environment: Environment) =>
	options.map(
		(options): NormalizedStaticOption => ({
			value: VariableInputTransformer.transformValue(options.value, environment),
			label: options.label,
			description: options.description,
		}),
	)

export const useStaticChoiceField = <StaticArity extends ChoiceFieldData.ChoiceArity>(
	props: StaticChoiceFieldProps<StaticArity>,
): ChoiceFieldData.MetadataByArity[StaticArity] => {
	if (props.arity === 'multiple') {
		throw new BindingError('Static multiple-choice choice fields are not supported yet.')
	}

	const environment = useEnvironment()
	const isMutating = useMutationState()
	const field = useRelativeSingleField(props)
	const options = React.useMemo(() => normalizeOptions(props.options, environment), [environment, props.options])
	const currentValue: ChoiceFieldData.ValueRepresentation = options.findIndex(({ value }) => field.hasValue(value))
	const data = React.useMemo(
		() =>
			options.map(({ label, description, value: actualValue }, i) => ({
				key: i,
				description,
				label,
				actualValue,
			})),
		[options],
	)
	const onChange = React.useCallback(
		(newValue: ChoiceFieldData.ValueRepresentation) => {
			field.updateValue?.(newValue === -1 ? null : options[newValue].value)
		},
		[field, options],
	)
	const metadata = React.useMemo<ChoiceFieldData.MetadataByArity['single']>(
		() => ({
			currentValue,
			data,
			onChange,
			errors: field.errors,
			environment,
			isMutating,
		}),
		[currentValue, data, environment, field.errors, isMutating, onChange],
	)

	return metadata as any // TS… 🙁
}

export const StaticChoiceField = Component<StaticChoiceFieldProps<any> & ChoiceFieldData.MetadataPropsByArity>(
	props => {
		const metadata = useStaticChoiceField(props)

		return props.children(metadata)
	},
	props => <Field {...props} />,
	'StaticChoiceField',
)
