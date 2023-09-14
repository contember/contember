import {
	Component,
	Field,
	FieldValue,
	QueryLanguage,
	SugarableRelativeSingleField,
	useEntity, useEnvironment,
} from '@contember/react-binding'
import { ReactElement, ReactNode, useMemo } from 'react'
import { FieldFallbackView, FieldFallbackViewPublicProps } from './FieldFallbackView'

export interface CoalesceFieldViewProps<Persisted extends FieldValue = FieldValue> extends FieldFallbackViewPublicProps {
	fields: (SugarableRelativeSingleField | string)[]
	format?: (value: Persisted) => ReactNode
}

/**
 * @group Field Views
 */
export const CoalesceFieldView = Component(
	<Persisted extends FieldValue = FieldValue>(props: CoalesceFieldViewProps<Persisted>) => {
		const entity = useEntity()
		const environment = useEnvironment()
		const desugaredFields = useMemo(
			() => props.fields.map(it => QueryLanguage.desugarRelativeSingleField(it, environment)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[environment, ...props.fields],
		)
		let value: Persisted | null = null
		for (const field of desugaredFields) {
			value = entity.getRelativeSingleField<Persisted>(field).value
			if (value !== null) {
				break
			}
		}

		if (value === null) {
			return <FieldFallbackView fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
		}
		if (props.format) {
			return <>{props.format(value)}</>
		}
		return <>{value}</>
	},
	(props: CoalesceFieldViewProps<any>) => {
		return (
			<>
				{props.fields.map((it, i) => (
					<Field key={i} field={it} />
				))}
			</>
		)
	},
) as <Persisted extends FieldValue = FieldValue>(props: CoalesceFieldViewProps<Persisted>) => ReactElement
