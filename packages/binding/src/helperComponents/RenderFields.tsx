import { useArrayMapMemo, useConstantLengthInvariant } from '@contember/react-utils'
import * as React from 'react'
import { useEntityContext, useEnvironment } from '../accessorRetrievers'
import { FieldAccessor } from '../accessors'
import { Component } from '../coreComponents'
import { QueryLanguage } from '../queryLanguage'
import { FieldValue, RelativeSingleField, SugaredRelativeSingleField } from '../treeParameters'
import { SugaredField } from './SugaredField'

interface RenderFieldsCommonProps {
	fallbackIfUnpersisted?: React.ReactNode
}

interface RenderFieldsProps extends RenderFieldsCommonProps {
	fields: Array<string | SugaredRelativeSingleField>
	render: (...accessors: FieldAccessor[]) => React.ReactNode
}

// Just short type aliases so that we can type the overloads in a tractable fashion.
type FV = FieldValue
type SRSF = string | SugaredRelativeSingleField
type CP = RenderFieldsCommonProps
type RN = React.ReactNode
type REN = React.ReactElement | null

export const RenderFields = Component<RenderFieldsProps>(
	({ fields, render, fallbackIfUnpersisted }) => {
		useConstantLengthInvariant(
			fields,
			`The number of fields in the 'fields' prop of the 'RenderFields' must remain constant between renders!`,
		)

		const entityAccessor = useEntityContext()
		const environment = useEnvironment()

		const desugarField = React.useCallback((rsf: SRSF) => QueryLanguage.desugarRelativeSingleField(rsf, environment), [
			environment,
		])
		const desugaredFields = useArrayMapMemo(fields, desugarField)

		const retrieveField = React.useCallback(
			(desugaredRsf: RelativeSingleField) => entityAccessor.getRelativeSingleField(desugaredRsf),
			[entityAccessor],
		)
		const accessors = useArrayMapMemo(desugaredFields, retrieveField)

		// TODO we probably want something like useDeferredValue from here.
		//      Will probably just wait for Concurrent React though.
		const output = React.useMemo(() => {
			if (!entityAccessor.isPersisted && fallbackIfUnpersisted !== undefined) {
				return fallbackIfUnpersisted
			}
			return render(...accessors)
		}, [accessors, entityAccessor.isPersisted, fallbackIfUnpersisted, render])

		return <>{output}</>
	},
	props => (
		<>
			{props.fallbackIfUnpersisted}
			{props.fields.map((field, i) => (
				<SugaredField key={i} field={field} />
			))}
		</>
	),
	'RenderFields',
) as {
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
	(props: RenderFieldsProps): REN
}
