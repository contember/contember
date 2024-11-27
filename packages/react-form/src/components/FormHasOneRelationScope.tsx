import * as React from 'react'
import { SugaredRelativeSingleEntity, useEntity } from '@contember/react-binding'
import { FormFieldStateProvider } from './FormFieldStateProvider'

export type FormHasOneRelationScopeProps = {
	field: SugaredRelativeSingleEntity['field']
	children: React.ReactNode
	required?: boolean
}

export const FormHasOneRelationScope = ({ field, children, required }: FormHasOneRelationScopeProps) => {
	const entityRelation = useEntity({ field })
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
