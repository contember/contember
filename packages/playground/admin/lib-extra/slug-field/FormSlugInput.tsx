import { FormInput, FormInputProps } from '@contember/react-form'
import { Component, Environment, Field, FieldAccessor, SugaredRelativeSingleField } from '@contember/interface'
import * as React from 'react'
import { ComponentType } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useSlugInput } from './useSlugInput'

export type FormSlugInputProps =
	& FormInputProps
	& SlugInputOwnProps

export type SlugPrefix = string | ((environment: Environment) => string)

export type SlugInputDerivedFrom =
	| SugaredRelativeSingleField['field']
	| FieldAccessor.GetFieldAccessor

export interface SlugInputOwnProps {
	slugify: (value: string) => string
	derivedFrom: SlugInputDerivedFrom[] | SlugInputDerivedFrom
	format?: (accessors: FieldAccessor[]) => string | null
	unpersistedHardPrefix?: SlugPrefix
	persistedHardPrefix?: SlugPrefix
	persistedSoftPrefix?: SlugPrefix
}

type InputProps = React.JSX.IntrinsicElements['input'] & {
	prefix?: string
	href?: string
}
const SlotInput = Slot as ComponentType<InputProps>

export const FormSlugInput = Component<FormSlugInputProps>(({
	derivedFrom,
	unpersistedHardPrefix,
	persistedHardPrefix,
	persistedSoftPrefix,
	format,
	children,
	field,
	slugify,
	...props
}, env) => {
	const { parseValue, formatValue, onBlur, hardPrefix, fullValue } = useSlugInput({
		field,
		slugify,
		derivedFrom,
		format,
		unpersistedHardPrefix,
		persistedHardPrefix,
		persistedSoftPrefix,
	})

	return (
		<FormInput
			field={field}
			parseValue={parseValue}
			formatValue={formatValue}
			{...props}
		>
			<SlotInput onBlur={onBlur} prefix={hardPrefix} href={fullValue ?? undefined}>
				{children}
			</SlotInput>
		</FormInput>
	)
}, ({ field, isNonbearing, defaultValue, derivedFrom }) => {
	const derivedFromArray = Array.isArray(derivedFrom) ? derivedFrom : [derivedFrom]
	return <>
		<Field field={field} isNonbearing={isNonbearing} defaultValue={defaultValue} />
		{derivedFromArray.map((it, index) => {
			if (typeof it === 'function') {
				return
			}
			return <Field field={it} key={index} />
		})}
	</>
})
