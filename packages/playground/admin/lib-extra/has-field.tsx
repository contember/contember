import { Component, SugaredRelativeSingleField } from '@contember/interface'
import { ReactNode } from 'react'
import { TreeNodeEnvironmentFactory } from '@contember/react-binding'

export const FieldExists = Component<{ children: ReactNode, field: SugaredRelativeSingleField['field'] }>(({ field, children }, env) => {
	try {
		TreeNodeEnvironmentFactory.createEnvironmentForField(env, { field })
	} catch (e: any) {
		if (import.meta.env.DEV) {
			console.warn(e)
			return <div>Field does not exist: {e.message}</div>
		}
		return null
	}

	return children
})
