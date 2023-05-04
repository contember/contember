import { Component, Field, FieldProps } from '../coreComponents'
import type { SugaredRelativeSingleField } from '../treeParameters'
import { FieldValue } from '../treeParameters'
import { ReactElement } from 'react'

export interface SugaredFieldProps<Persisted extends FieldValue = FieldValue> extends Omit<FieldProps<Persisted>, 'field'> {
	field: string | SugaredRelativeSingleField
}

/**
 * @group Data binding
 */
export const SugaredField = Component(<Persisted extends FieldValue = FieldValue>(props: SugaredFieldProps<Persisted>) => {
	if (typeof props.field === 'string') {
		return <Field {...props} field={props.field} />
	}
	return <Field {...props} {...props.field} />
}, 'SugaredField') as <Persisted extends FieldValue = FieldValue>(props: SugaredFieldProps<Persisted>) => ReactElement
