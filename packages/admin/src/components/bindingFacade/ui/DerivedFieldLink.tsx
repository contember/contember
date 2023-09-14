import { Component, FieldValue, SugaredField, SugaredRelativeSingleField, useDerivedField } from '@contember/react-binding'
import type { FunctionComponent } from 'react'

export interface DerivedFieldLinkProps<SourcePersisted extends FieldValue = FieldValue> {
	sourceField: string | SugaredRelativeSingleField
	derivedField: string | SugaredRelativeSingleField
	transform?: (sourceValue: SourcePersisted | null) => SourcePersisted | null
	agent?: string
}

/**
 * @group Data binding
 */
export const DerivedFieldLink: FunctionComponent<DerivedFieldLinkProps> = Component(
	props => {
		useDerivedField(props.sourceField, props.derivedField, props.transform, props.agent)
		return null
	},
	props => (
		<>
			<SugaredField field={props.sourceField} />
			<SugaredField field={props.derivedField} />
		</>
	),
	'DerivedFieldLink',
)
