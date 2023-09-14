import { useArrayMapMemo, useConstantLengthInvariant } from '@contember/react-utils'
import { ReactElement, ReactNode, useCallback, useMemo } from 'react'
import { useEntity } from '../accessorPropagation'
import type { FieldAccessor, FieldValue, RelativeSingleField, SugaredRelativeSingleField } from '@contember/binding'
import { QueryLanguage, throwBindingError } from '@contember/binding'
import { Component } from '../coreComponents'
import { SugaredField } from './SugaredField'

export interface FieldViewCommonProps {
	fallbackIfUnpersisted?: ReactNode
}

export type FieldViewProps =
	& FieldViewCommonProps
	& (
		| {
				render: (...accessors: FieldAccessor[]) => ReactNode
				field: string | SugaredRelativeSingleField
		  }
		| {
				render: (...accessors: FieldAccessor[]) => ReactNode
				fields: Array<string | SugaredRelativeSingleField>
		  }
	)

/**
 * Base field view component with no default formatting.
 *
 * @example
 * ```
 * <FieldView
 *   field="startsAt"
 *   render={(accessor) => <>{accessor.value}</>}
 * />
 * ```
 *
 * @group Field Views
 */
export const FieldView = Component<FieldViewProps>(
	props => {
		const { fallbackIfUnpersisted, render } = props
		const fields =
			'fields' in props && Array.isArray(props.fields)
				? props.fields
				: 'field' in props && props.field
				? [props.field]
				: throwBindingError(`FieldView: failed to supply either the 'field' or the 'fields' prop.`)

		useConstantLengthInvariant(
			fields,
			`The number of fields in the 'fields' prop of the 'FieldView' must remain constant between renders!`,
		)

		// TODO over-subscribe less
		const entityAccessor = useEntity()
		const environment = entityAccessor.environment

		const desugarField = useCallback(
			(rsf: string | SugaredRelativeSingleField) => QueryLanguage.desugarRelativeSingleField(rsf, environment),
			[environment],
		)
		const desugaredFields = useArrayMapMemo(fields, desugarField)

		const retrieveField = useCallback(
			(desugaredRsf: RelativeSingleField) => entityAccessor.getRelativeSingleField(desugaredRsf),
			[entityAccessor],
		)
		const accessors = useArrayMapMemo(desugaredFields, retrieveField)

		// TODO we probably want something like useDeferredValue from here.
		//      Will probably just wait for Concurrent React though.
		const output = useMemo(() => {
			if (!entityAccessor.existsOnServer && fallbackIfUnpersisted !== undefined) {
				return fallbackIfUnpersisted
			}
			return render(...accessors)
		}, [accessors, entityAccessor.existsOnServer, fallbackIfUnpersisted, render])

		return <>{output}</>
	},
	props => {
		const fields =
			'fields' in props && Array.isArray(props.fields)
				? props.fields
				: 'field' in props && props.field
				? [props.field]
				: throwBindingError(`FieldView: failed to supply either the 'field' or the 'fields' prop.`)
		return (
			<>
				{props.fallbackIfUnpersisted}
				{fields.map((field, i) => (
					<SugaredField key={i} field={field} />
				))}
			</>
		)
	},
	'FieldView',
) as FieldViewComponentSignature

export type FieldViewComponentSignature = {
	<FV1 extends FieldValue>(
		props:
			& FieldViewCommonProps
			& {
			field: string | SugaredRelativeSingleField;
			render: (field1: FieldAccessor<FV1>) => ReactNode
		},
	): ReactElement | null

	<FV1 extends FieldValue>(
		props:
			& FieldViewCommonProps
			& {
			fields: [string | SugaredRelativeSingleField];
			render: (field1: FieldAccessor<FV1>) => ReactNode
		},
	): ReactElement | null

	<FV1 extends FieldValue, FV2 extends FieldValue>(
		props:
			& FieldViewCommonProps
			& {
			fields: [string | SugaredRelativeSingleField, string | SugaredRelativeSingleField];
			render: (field1: FieldAccessor<FV1>, field2: FieldAccessor<FV2>) => ReactNode
		},
	): ReactElement | null

	<FV1 extends FieldValue, FV2 extends FieldValue, FV3 extends FieldValue>(
		props:
			& FieldViewCommonProps
			& {
			fields: [string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField]
			render: (field1: FieldAccessor<FV1>, field2: FieldAccessor<FV2>, field3: FieldAccessor<FV3>) => ReactNode
		},
	): ReactElement | null

	<FV1 extends FieldValue, FV2 extends FieldValue, FV3 extends FieldValue, FV4 extends FieldValue>(
		props:
			& FieldViewCommonProps
			& {
			fields: [string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField]
			render: (field1: FieldAccessor<FV1>, field2: FieldAccessor<FV2>, field3: FieldAccessor<FV3>, field4: FieldAccessor<FV4>) => ReactNode
		},
	): ReactElement | null

	<FV1 extends FieldValue, FV2 extends FieldValue, FV3 extends FieldValue, FV4 extends FieldValue, FV5 extends FieldValue>(
		props:
			& FieldViewCommonProps
			& {
			fields: [string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField]
			render: (field1: FieldAccessor<FV1>, field2: FieldAccessor<FV2>, field3: FieldAccessor<FV3>, field4: FieldAccessor<FV4>, field5: FieldAccessor<FV5>) => ReactNode
		},
	): ReactElement | null

	(props: FieldViewProps): ReactElement | null
}
