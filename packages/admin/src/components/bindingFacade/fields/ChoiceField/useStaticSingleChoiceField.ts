import { ChoiceFieldData } from './ChoiceFieldData'
import { Environment, useEnvironment, useField, useMutationState, VariableInputTransformer } from '@contember/binding'
import { useCallback, useMemo } from 'react'
import {
	NormalizedStaticOption,
	OptionallyVariableStaticOption,
	StaticSingleChoiceFieldProps,
} from './StaticSingleChoiceField'
import { useAccessorErrors } from '../../errors'

export const useStaticSingleChoiceField = (
	props: StaticSingleChoiceFieldProps,
): ChoiceFieldData.SingleChoiceFieldMetadata => {

	const environment = useEnvironment()
	const isMutating = useMutationState()
	const field = useField(props)
	const options = useMemo(() => normalizeOptions(props.options, environment), [environment, props.options])
	const currentValue: ChoiceFieldData.ValueRepresentation = options.findIndex(({ value }) => field.hasValue(value))
	const data = useMemo(
		() =>
			options.map(({ label, description, value: actualValue, searchKeywords }, i) => ({
				key: i,
				description,
				label,
				actualValue,
				searchKeywords: searchKeywords ?? '',
			})),
		[options],
	)
	const onChange = useCallback(
		(newValue: ChoiceFieldData.ValueRepresentation) => {
			field.updateValue(newValue === -1 ? null : options[newValue].value)
		},
		[field, options],
	)
	const errors = useAccessorErrors(field)
	return useMemo<ChoiceFieldData.SingleChoiceFieldMetadata>(
		() => ({
			currentValue,
			data,
			onChange,
			errors,
			environment,
			isMutating,
		}),
		[currentValue, data, environment, errors, isMutating, onChange],
	)
}
const normalizeOptions = (options: OptionallyVariableStaticOption[], environment: Environment) =>
	options.map(
		(options): NormalizedStaticOption => ({
			searchKeywords: options.searchKeywords ?? '',
			value: VariableInputTransformer.transformValue(options.value, environment),
			label: options.label,
			description: options.description,
		}),
	)

