import { ChoiceFieldData } from '../ChoiceFieldData'
import { Scalar, useEnvironment, useField, VariableInputTransformer } from '@contember/binding'
import { useCallback, useMemo, useState } from 'react'
import { OptionallyVariableStaticOption, StaticSingleChoiceFieldProps } from '../StaticSingleChoiceField'
import { useAccessorErrors } from '../../../errors'
import { useFuseFilteredOptions } from './useFuseFilteredOptions'

export const useStaticSingleChoiceField = (
	props: StaticSingleChoiceFieldProps,
): ChoiceFieldData.SingleChoiceFieldMetadata<Scalar> => {
	const [input, setSearchInput] = useState('')
	const field = useField(props)
	const data = useNormalizedOptions(props.options)
	const filteredData = useFuseFilteredOptions(props, data, input)

	const currentValue = useMemo(() => data.find(it => field.hasValue(it.actualValue)) ?? null, [data, field])

	const errors = useAccessorErrors(field)

	const onSelect = useCallback((value: ChoiceFieldData.SingleDatum<Scalar>) => {
		field.updateValue(value.actualValue)
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
			options.map(({ label, description, value: actualValue, searchKeywords }, i): ChoiceFieldData.SingleDatum<Scalar> => {
				const value = VariableInputTransformer.transformValue(actualValue, environment)
				return ({
					key: i.toString(),
					searchKeywords: searchKeywords ?? `${label} ${value}`,
					label,
					description,
					actualValue: value,
				})
			}),
		[environment, options],
	)
}
