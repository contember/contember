import * as React from 'react'
import { HasOneRelationMarker, SugaredRelativeSingleEntity, useEntity } from '@contember/react-binding'
import { FormFieldStateProvider } from './FormFieldStateProvider'
import { useMemo } from 'react'

export type FormHasOneRelationScopeProps = {
	field: SugaredRelativeSingleEntity['field']
	children: React.ReactNode
	required?: boolean
}

export const FormHasOneRelationScope = ({ field, children, required }: FormHasOneRelationScopeProps) => {
	const entityRelation = useEntity({ field })
	const marker = entityRelation.getMarker() as HasOneRelationMarker
	const fieldName = marker.parameters.field
	const entityName = entityRelation.getParent()!.name
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
