import { Component, FieldValue, SugaredField, SugaredFieldProps, useField } from '@contember/react-binding'
import type { ReactElement } from 'react'
import { FieldFallbackView, FieldFallbackViewPublicProps } from './FieldFallbackView'
import { HTMLVideoElementProps } from '@contember/ui'

export type VideoFieldViewProps<SrcField extends FieldValue = string> =
	& {
		srcField: SugaredFieldProps['field']
		titleField?: SugaredFieldProps['field']
		formatUrl?: (srcFieldValue: SrcField) => string

	}
	& FieldFallbackViewPublicProps
	& Omit<HTMLVideoElementProps, 'src'>

/**
 * @group Field Views
 */
export const VideoFieldView = Component(
	<SrcField extends FieldValue = string>({
		srcField,
		titleField,
		formatUrl,
		fallback,
		fallbackStyle,
		...videoProps
	}: VideoFieldViewProps<SrcField>) => {
		const srcAccessor = useField<SrcField>(srcField)
		const titleAccessor = useField<string>(titleField)

		if (srcAccessor.value === null) {
			return <FieldFallbackView fallback={fallback} fallbackStyle={fallbackStyle} />
		}
		return (
			// The spread intentionally comes after alt and title so that it's possible to provide just static string values.
			<video
				src={formatUrl ? formatUrl(srcAccessor.value) : (srcAccessor.value as string)}
				title={titleAccessor?.value || undefined}
				controls
				{...videoProps}
			/>
		)
	},
	({ srcField, titleField, fallback, fallbackStyle }) => (
		<>
			<SugaredField field={srcField} />
			{titleField && <SugaredField field={titleField} />}
			<FieldFallbackView fallback={fallback} fallbackStyle={fallbackStyle} />
		</>
	),
	'VideoFieldView',
) as <SrcField extends FieldValue = string>(props: VideoFieldViewProps<SrcField>) => ReactElement
