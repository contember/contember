import { GraphQlBuilder } from '@contember/client'
import * as React from 'react'
import { useField } from '../accessorPropagation'
import { MarkerFactory } from '../queryLanguage'
import { FieldValue, SugaredRelativeSingleField } from '../treeParameters'
import { Component } from './Component'

export interface FieldBasicProps extends SugaredRelativeSingleField {}

export interface FieldRuntimeProps<Persisted extends FieldValue = FieldValue> {
	format?: (value: Persisted | null) => React.ReactNode
}

export interface FieldProps<Persisted extends FieldValue = FieldValue>
	extends FieldBasicProps,
		FieldRuntimeProps<Persisted> {}

export const Field = Component(
	<Persisted extends FieldValue = FieldValue>(props: FieldProps<Persisted>) => {
		const field = useField<Persisted>(props)

		if (props.format !== undefined) {
			return <>{props.format(field.currentValue)}</>
		}

		if (
			field.currentValue instanceof GraphQlBuilder.Literal ||
			field.currentValue === null ||
			typeof field.currentValue === 'boolean'
		) {
			return null
		}
		return <>{field.currentValue}</>
	},
	{
		generateFieldMarker: (props, environment) => MarkerFactory.createFieldMarker(props, environment),
	},
	'Field',
) as <Persisted extends FieldValue = FieldValue>(props: FieldProps<Persisted>) => React.ReactElement
