import { SugaredRelativeEntityList, useEntityList } from '@contember/react-binding'
import * as React from 'react'
import { FormFieldStateProvider } from './FormFieldStateProvider'

export type FormHasManyRelationScopeProps = {
	field: SugaredRelativeEntityList['field']
	children: React.ReactNode
	required?: boolean
}

export const FormHasManyRelationScope = ({ field, children, required }: FormHasManyRelationScopeProps) => {
	const entityRelation = useEntityList({ field })
	return (
		<FormFieldStateProvider
			errors={entityRelation.errors?.errors}
			dirty={entityRelation.hasUnpersistedChanges}
			required={required}
		>
			{children}
		</FormFieldStateProvider>
	)
}
