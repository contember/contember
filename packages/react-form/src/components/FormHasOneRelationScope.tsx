import * as React from 'react'
import { useId } from 'react'
import { FormErrorContext, FormFieldIdContext } from '../contexts'
import { SugaredRelativeSingleEntity } from '@contember/binding'
import { useEntity } from '@contember/react-binding'

const emptyArr: [] = []

export type FormHasOneRelationScopeProps = {
	field: SugaredRelativeSingleEntity['field']
	children: React.ReactNode
}

export const FormHasOneRelationScope = ({ field, children }: FormHasOneRelationScopeProps) => {
	const id = useId()
	const entityRelation = useEntity({ field })
	const errors = entityRelation.errors?.errors
	return (
		<FormFieldIdContext.Provider value={id}>
			<FormErrorContext.Provider value={errors ?? emptyArr}>
				{children}
			</FormErrorContext.Provider>
		</FormFieldIdContext.Provider>
	)
}
