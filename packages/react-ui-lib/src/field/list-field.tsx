import { SugaredRelativeSingleField, useField, type FieldValue } from '@contember/interface'
import { Fragment, ReactNode } from 'react'
import { useEnumOptionsFormatter } from '../labels'

export type ListFieldProps<T, > = {
	field: SugaredRelativeSingleField['field']
	render?: (value: T) => ReactNode
	separator?: ReactNode
	fallback?: ReactNode
}

export const ListField = (<T extends FieldValue = FieldValue>({ field, render, separator, fallback }: ListFieldProps<T>) => {
	const value = useField<T[]>(field).value
	if (!value || value.length === 0) {
		return fallback ?? null
	}

	return (
		<>
			{value.map((item, index) => (
				<Fragment key={index}>
					{render ? render(item) : <>{item}</>}
					{index < value.length - 1 && separator}
				</Fragment>
			))}
		</>
	)

}) as <T extends FieldValue = FieldValue>(props: ListFieldProps<T>) => ReactNode

export type EnumListFieldProps = {
	field: SugaredRelativeSingleField['field']
	options?: Record<string, ReactNode>
	decorate?: (value: ReactNode) => ReactNode
	separator?: ReactNode
	fallback?: ReactNode
}

export const EnumListField = ({ field, decorate, separator, fallback, options }: EnumListFieldProps) => {
	const fieldAccessor = useField(field)
	const enumOptions = useEnumOptionsFormatter()
	if (!fieldAccessor.schema.enumName) {
		throw new Error('Field is not an enum field')
	}
	const optionsResolved = options ?? enumOptions(fieldAccessor.schema.enumName)
	return <ListField<string> field={field} separator={separator} fallback={fallback} render={value => {
		const enumValue = optionsResolved[value]
		return decorate ? decorate(enumValue) : enumValue
	}} />

}
