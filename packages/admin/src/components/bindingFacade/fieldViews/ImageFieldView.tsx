import { Component, FieldValue, SugaredField, SugaredFieldProps, useField } from '@contember/binding'
import type { ReactElement } from 'react'
import { FieldFallbackView, FieldFallbackViewPublicProps } from './FieldFallbackView'
import { HTMLImageElementProps } from '@contember/ui'

export type ImageFieldViewProps<SrcField extends FieldValue = string> =
	& {
		srcField: SugaredFieldProps['field']
		altField?: SugaredFieldProps['field']
		titleField?: SugaredFieldProps['field']
		formatUrl?: (srcFieldValue: SrcField) => string
	}
	& FieldFallbackViewPublicProps
	& Omit<HTMLImageElementProps, 'src'>

/**
 * @group Field Views
 */
export const ImageFieldView = Component(
	<SrcField extends FieldValue = string>({
		srcField,
		altField,
		titleField,
		formatUrl,
		fallback,
		fallbackStyle,
		...imgProps
	}: ImageFieldViewProps<SrcField>) => {
		const srcAccessor = useField<SrcField>(srcField)
		const altAccessor = useField<string>(altField)
		const titleAccessor = useField<string>(titleField)

		if (srcAccessor.value === null) {
			return <FieldFallbackView fallback={fallback} fallbackStyle={fallbackStyle} />
		}
		return (
			// The spread intentionally comes after alt and title so that it's possible to provide just static string values.
			<img
				src={formatUrl ? formatUrl(srcAccessor.value) : (srcAccessor.value as string)}
				alt={altAccessor?.value || undefined}
				title={titleAccessor?.value || undefined}
				{...imgProps}
			/>
		)
	},
	({ altField, srcField, titleField, fallback, fallbackStyle }) => (
		<>
			<SugaredField field={srcField} />
			{altField && <SugaredField field={altField} />}
			{titleField && <SugaredField field={titleField} />}
			<FieldFallbackView fallback={fallback} fallbackStyle={fallbackStyle} />
		</>
	),
	'ImageFieldView',
) as <SrcField extends FieldValue = string>(props: ImageFieldViewProps<SrcField>) => ReactElement
