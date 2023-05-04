import { useArrayMapMemo, useConstantLengthInvariant } from '@contember/react-utils'
import { ReactElement, ReactNode, useCallback, useMemo } from 'react'
import { useEntity } from '../accessorPropagation'
import type { FieldAccessor } from '../accessors'
import { throwBindingError } from '../BindingError'
import { Component } from '../coreComponents'
import { QueryLanguage } from '../queryLanguage'
import type { FieldValue, RelativeSingleField, SugaredRelativeSingleField } from '../treeParameters'
import { SugaredField } from './SugaredField'

interface FieldViewCommonProps {
	fallbackIfUnpersisted?: ReactNode
}

type FieldViewProps = FieldViewCommonProps &
	(
		| {
				render: (...accessors: FieldAccessor[]) => ReactNode
				field: string | SugaredRelativeSingleField
		  }
		| {
				render: (...accessors: FieldAccessor[]) => ReactNode
				fields: Array<string | SugaredRelativeSingleField>
		  }
	)

// Just short type aliases so that we can type the overloads in a tractable fashion.
type FV = FieldValue
type SRSF = string | SugaredRelativeSingleField
type CP = FieldViewCommonProps
type RN = ReactNode
type REN = ReactElement | null

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
			(rsf: SRSF) => QueryLanguage.desugarRelativeSingleField(rsf, environment),
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
) as {
	<FV1 extends FV>(props: CP & { field: SRSF; render: (field1: FieldAccessor<FV1>) => RN }): REN
	<FV1 extends FV>(props: CP & { fields: [SRSF]; render: (field1: FieldAccessor<FV1>) => RN }): REN
	<FV1 extends FV, FV2 extends FV>(
		props: CP & { fields: [SRSF, SRSF]; render: (field1: FieldAccessor<FV1>, field2: FieldAccessor<FV2>) => RN },
	): REN
	<FV1 extends FV, FV2 extends FV, FV3 extends FV>(
		props: CP & {
			fields: [SRSF, SRSF, SRSF]
			render: (field1: FieldAccessor<FV1>, field2: FieldAccessor<FV2>, field3: FieldAccessor<FV3>) => RN
		},
	): REN
	<FV1 extends FV, FV2 extends FV, FV3 extends FV, FV4 extends FV>(
		props: CP & {
			fields: [SRSF, SRSF, SRSF, SRSF]
			render: (
				field1: FieldAccessor<FV1>,
				field2: FieldAccessor<FV2>,
				field3: FieldAccessor<FV3>,
				field4: FieldAccessor<FV4>,
			) => RN
		},
	): REN
	<FV1 extends FV, FV2 extends FV, FV3 extends FV, FV4 extends FV, FV5 extends FV>(
		props: CP & {
			fields: [SRSF, SRSF, SRSF, SRSF, SRSF]
			render: (
				field1: FieldAccessor<FV1>,
				field2: FieldAccessor<FV2>,
				field3: FieldAccessor<FV3>,
				field4: FieldAccessor<FV4>,
				field5: FieldAccessor<FV5>,
			) => RN
		},
	): REN
	(props: FieldViewProps): REN
}
