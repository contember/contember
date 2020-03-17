import {
	Component,
	Field,
	FieldProps,
	FieldValue,
	useOptionalRelativeSingleField,
	useRelativeSingleField,
} from '@contember/binding'
import * as React from 'react'

export interface ImageFieldViewProps<SrcField extends FieldValue = string>
	extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
	srcField: FieldProps['field']
	altField?: FieldProps['field']
	titleField?: FieldProps['field']
	formatUrl?: (srcFieldValue: SrcField) => string
	fallback?: React.ReactNode
}

export const ImageFieldView = Component(
	<SrcField extends FieldValue = string>({
		srcField,
		altField,
		titleField,
		formatUrl,
		fallback,
		...imgProps
	}: ImageFieldViewProps<SrcField>) => {
		const srcAccessor = useRelativeSingleField<SrcField>(srcField)
		const altAccessor = useOptionalRelativeSingleField<string>(altField)
		const titleAccessor = useOptionalRelativeSingleField<string>(titleField)

		if (!srcAccessor.currentValue) {
			return <>{fallback}</>
		}
		return (
			// The spread intentionally comes after alt and title so that it's possible to provide just static string values.
			<img
				src={formatUrl ? formatUrl(srcAccessor.currentValue) : (srcAccessor.currentValue as string)}
				alt={altAccessor?.currentValue || undefined}
				title={titleAccessor?.currentValue || undefined}
				{...imgProps}
			/>
		)
	},
	({ altField, srcField, titleField }) => (
		<>
			<Field field={srcField} />
			{altField && <Field field={altField} />}
			{titleField && <Field field={titleField} />}
		</>
	),
	'ImageFieldView',
) as <SrcField extends FieldValue = string>(props: ImageFieldViewProps<SrcField>) => React.ReactElement
