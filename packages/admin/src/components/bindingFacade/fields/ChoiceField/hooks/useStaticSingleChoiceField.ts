import { ChoiceFieldData } from '../ChoiceFieldData'
import {
	Environment,
	Scalar,
	useEnvironment,
	useField,
	useMutationState,
	VariableInputTransformer,
} from '@contember/binding'
import { useCallback, useMemo } from 'react'
import {
	NormalizedStaticOption,
	OptionallyVariableStaticOption,
	StaticSingleChoiceFieldProps,
} from '../StaticSingleChoiceField'
import { useAccessorErrors } from '../../../errors'

export const useStaticSingleChoiceField = (
	props: StaticSingleChoiceFieldProps,
): ChoiceFieldData.SingleChoiceFieldMetadata<Scalar> => {

	const environment = useEnvironment()
	const isMutating = useMutationState()
	const field = useField(props)
	const options = useMemo(() => normalizeOptions(props.options, environment), [environment, props.options])
	const data = useMemo(
		() =>
			options.map(({ label, description, value: actualValue, searchKeywords }, i) => ({
				key: i.toString(),
				description,
				label,
				actualValue,
				searchKeywords: searchKeywords ?? '',
			})),
		[options],
	)
	const currentValue: ChoiceFieldData.SingleDatum<Scalar> | null = data.find(it => field.hasValue(it.actualValue)) ?? null

	const errors = useAccessorErrors(field)
	const onSelect = useCallback((value: ChoiceFieldData.SingleDatum<Scalar>) => {
		field.updateValue(value.actualValue)
	}, [field])
	const onClear = useCallback(() => {
		field.updateValue(null)
	}, [field])
	return useMemo<ChoiceFieldData.SingleChoiceFieldMetadata<Scalar>>(
		() => ({
			currentValue,
			data,
			onSelect: onSelect,
			onClear: onClear,
			errors,
			environment,
			isMutating,
			// todo onSearch
		}),
		[currentValue, data, environment, errors, isMutating, onClear, onSelect],
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

