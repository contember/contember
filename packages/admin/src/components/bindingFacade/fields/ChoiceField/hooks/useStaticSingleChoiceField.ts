import { ChoiceFieldData } from '../ChoiceFieldData'
import { FieldValue, useEnvironment, useField, VariableInputTransformer } from '@contember/binding'
import { useCallback, useMemo, useState } from 'react'
import { OptionallyVariableStaticOption, StaticSingleChoiceFieldProps } from '../StaticSingleChoiceField'
import { useAccessorErrors } from '../../../errors'
import { useFuseFilteredOptions } from './useFuseFilteredOptions'

export const useStaticSingleChoiceField = (
	props: StaticSingleChoiceFieldProps,
): ChoiceFieldData.SingleChoiceFieldMetadata<FieldValue> => {
	const [input, setSearchInput] = useState('')
	const field = useField(props)
	const data = useNormalizedOptions(props.options)
	const filteredData = useFuseFilteredOptions(props, data, input)

	const currentValue = useMemo(() => data.find(it => field.hasValue(it.value)) ?? null, [data, field])

	const errors = useAccessorErrors(field)

	const onSelect = useCallback((value: ChoiceFieldData.SingleOption<FieldValue>) => {
		field.updateValue(value.value)
	}, [field])
	const onClear = useCallback(() => {
		field.updateValue(null)
	}, [field])

	return {
		currentValue,
		data: filteredData,
		onSelect: onSelect,
		onClear: onClear,
		errors,
		onSearch: setSearchInput,
	}
}


const useNormalizedOptions = (options: OptionallyVariableStaticOption[]) => {
	const environment = useEnvironment()
	return useMemo(
		() =>
			options.map(({ label, description, value, searchKeywords }, i): ChoiceFieldData.SingleOption<FieldValue> => {
				const transformValue = VariableInputTransformer.transformValue(value, environment)
				return ({
					key: i.toString(),
					searchKeywords: searchKeywords ?? `${label} ${transformValue}`,
					label,
					description,
					value: transformValue,
				})
			}),
		[environment, options],
	)
}
