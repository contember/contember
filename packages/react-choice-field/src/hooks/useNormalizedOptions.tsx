import { useMemo } from 'react'
import { BaseDynamicChoiceField } from '../BaseDynamicChoiceField'
import { Entity, EntityAccessor } from '@contember/react-binding'
import { DesugaredOptionPath } from './useDesugaredOptionPath'
import { useSearchFields } from './useSearchFields'
import { ChoiceFieldOptions, ChoiceFieldSingleOption } from '../ChoiceFieldOptions'

export const useNormalizedOptions = (
	optionEntities: EntityAccessor[],
	desugaredOptionPath: DesugaredOptionPath,
	{ searchByFields, ...props }: BaseDynamicChoiceField,
): ChoiceFieldOptions<EntityAccessor> => {
	const desugaredSearchFields = useSearchFields(searchByFields)
	const renderOption = 'renderOption' in props && props.renderOption ? props.renderOption : undefined
	const optionLabel = 'optionLabel' in props && props.optionLabel ? props.optionLabel : undefined
	return useMemo(
		() =>
			optionEntities.map((item, i): ChoiceFieldSingleOption<EntityAccessor> => {
				let label
				if (renderOption) {
					label = renderOption(item)
				} else if (optionLabel) {
					label = <Entity accessor={item} > { optionLabel } </Entity>
				} else if ('field' in desugaredOptionPath) {
					label = `${item.getRelativeSingleField(desugaredOptionPath).value ?? ''}`
				} else {
					label = ''
				}

				let searchKeywords: string

				if (desugaredSearchFields.length) {
					searchKeywords = desugaredSearchFields
						.map(desugared => item.getRelativeSingleField<string>(desugared).value ?? '')
						.join(' ')
				} else if (typeof label === 'string') {
					searchKeywords = label
				} else {
					// TODO we're failing silently which is not ideal but at the same time it's not correct to throw.
					searchKeywords = ''
				}

				return {
					key: item.id.toString(),
					label,
					searchKeywords,
					value: item,
				}
			}),
		[optionEntities, renderOption, optionLabel, desugaredOptionPath, desugaredSearchFields],
	)
}
