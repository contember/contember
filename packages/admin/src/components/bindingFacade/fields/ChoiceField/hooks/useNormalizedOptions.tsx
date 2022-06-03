import { ChoiceFieldData } from '../ChoiceFieldData'
import { useMemo } from 'react'
import { BaseDynamicChoiceField } from '../BaseDynamicChoiceField'
import { Entity, EntityAccessor, QueryLanguage, useEnvironment } from '@contember/binding'
import { DesugaredOptionPath } from './useDesugaredOptionPath'

export const useNormalizedOptions = (
	optionEntities: EntityAccessor[],
	desugaredOptionPath: DesugaredOptionPath,
	{ searchByFields, ...props }: BaseDynamicChoiceField,
): ChoiceFieldData.Data<EntityAccessor> => {
	const sugaredSearchFields = useMemo(
		() => (searchByFields === undefined ? [] : Array.isArray(searchByFields) ? searchByFields : [searchByFields]),
		[searchByFields],
	)
	const environment = useEnvironment()
	const desugaredSearchFields = useMemo(
		() => sugaredSearchFields.map(field => QueryLanguage.desugarRelativeSingleField(field, environment)),
		[sugaredSearchFields, environment],
	)
	const renderOption = 'renderOption' in props && props.renderOption ? props.renderOption : undefined
	const optionLabel = 'optionLabel' in props && props.optionLabel ? props.optionLabel : undefined
	return useMemo(
		() =>
			optionEntities.map((item, i): ChoiceFieldData.SingleDatum<EntityAccessor> => {
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
					actualValue: item,
				}
			}),
		[optionEntities, renderOption, optionLabel, desugaredOptionPath, desugaredSearchFields],
	)
}
