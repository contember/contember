import { useMemo } from 'react'
import { BaseDynamicChoiceField } from '../BaseDynamicChoiceField'
import { QualifiedEntityList, QualifiedFieldList, QueryLanguage, useEnvironment } from '@contember/binding'

export type DesugaredOptionPath = QualifiedFieldList | QualifiedEntityList;

export const useDesugaredOptionPath = (props: BaseDynamicChoiceField): DesugaredOptionPath => {
	const environment = useEnvironment()
	return useMemo(() => {
		if ('optionsStaticRender' in props || 'optionLabel' in props) {
			return QueryLanguage.desugarQualifiedEntityList(
				typeof props.options === 'string' || !('entities' in props.options)
					? {
						entities: props.options,
					}
					: props.options,
				environment,
			)
		}
		return QueryLanguage.desugarQualifiedFieldList(
			typeof props.options === 'string' || !('fields' in props.options)
				? {
					fields: props.options,
				}
				: props.options,
			environment,
		)
	}, [environment, props])
}
