import { SugaredRelativeEntityList, useEntityList } from '@contember/react-binding'
import * as React from 'react'
import { useId } from 'react'
import { FormErrorContext, FormFieldIdContext } from '../contexts'

const emptyArr: [] = []

export type FormHasManyRelationScopeProps = {
	field: SugaredRelativeEntityList['field']
	children: React.ReactNode
}

export const FormHasManyRelationScope = ({ field, children }: FormHasManyRelationScopeProps) => {
	const id = useId()
	const entityRelation = useEntityList({ field })
	const errors = entityRelation.errors?.errors
	return (
		<FormFieldIdContext.Provider value={id}>
			<FormErrorContext.Provider value={errors ?? emptyArr}>
				{children}
			</FormErrorContext.Provider>
		</FormFieldIdContext.Provider>
	)
}
