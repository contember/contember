import { FieldMarker, HasOneRelationMarker, MeaningfulMarker, SugaredRelativeSingleField } from '@contember/binding'
import { createCoalesceFilter } from '@contember/react-dataview'
import { useMemo } from 'react'

export type SelectFilterFieldProps = {
	filterField?: SugaredRelativeSingleField['field'] | SugaredRelativeSingleField['field'][]
}

export const useSelectFilter = ({ filterField, marker }: SelectFilterFieldProps & {
	marker: Exclude<MeaningfulMarker, FieldMarker>
}) => {
	return useMemo(() => {
		const filter = filterField ?? extractStringFields(marker)
		if (!filter || (Array.isArray(filter) && filter.length === 0)) {
			return undefined
		}
		return createCoalesceFilter(Array.isArray(filter) ? filter : [filter])
	}, [filterField, marker])
}

const extractStringFields = (marker: Exclude<MeaningfulMarker, FieldMarker>): string[] => {
	const node = marker.environment.getSubTreeNode()
	const textFields = []
	for (const field of marker.fields.markers.values()) {
		if (field instanceof FieldMarker) {
			const columnInfo = node.entity.fields.get(field.fieldName)
			if (columnInfo?.type === 'String') {
				textFields.push(field.fieldName)
			}
		} else if (field instanceof HasOneRelationMarker) {
			textFields.push(...extractStringFields(field).map(it => `${field.parameters.field}.${it}`))
		}
	}
	return textFields
}
