import { HasManyRelationMarker, SugaredRelativeEntityList, useEntityList } from '@contember/react-binding'
import * as React from 'react'
import { FormFieldStateProvider } from './FormFieldStateProvider'
import { useMemo } from 'react'

export type FormHasManyRelationScopeProps = {
	field: SugaredRelativeEntityList['field']
	children: React.ReactNode
	required?: boolean
}

export const FormHasManyRelationScope = ({ field, children, required }: FormHasManyRelationScopeProps) => {
	const entityRelation = useEntityList({ field })
	const entityName = entityRelation.getParent()!.name
	const marker = entityRelation.getMarker() as HasManyRelationMarker
	const fieldName = marker.parameters.field
	const fieldInfo = useMemo(() => ({ entityName, fieldName }), [entityName, fieldName])

	return (
		<FormFieldStateProvider
			errors={entityRelation.errors?.errors}
			dirty={entityRelation.hasUnpersistedChanges}
			required={required}
			field={fieldInfo}
		>
			{children}
		</FormFieldStateProvider>
	)
}
