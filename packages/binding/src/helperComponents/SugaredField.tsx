import * as React from 'react'
import { Component, Field } from '../coreComponents'
import { SugaredRelativeSingleField } from '../treeParameters'

export interface SugaredFieldProps {
	field: string | SugaredRelativeSingleField
}

export const SugaredField = Component<SugaredFieldProps>(props => {
	if (typeof props.field === 'string') {
		return <Field field={props.field} />
	}
	return <Field {...props.field} />
}, 'SugaredField')
