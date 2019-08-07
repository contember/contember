import * as React from 'react'
import { FormGroup, FormGroupProps } from '../../../../components/ui'
import { Field, FieldPublicProps } from '../../../coreComponents'
import { DataBindingError, FieldAccessor } from '../../../dao'
import { SimpleRelativeSingleField } from '../../auxiliary'
import { ClearFieldButtonInner, ClearFieldButtonInnerPublicProps } from './ClearFieldButtonInner'

export interface ClearFieldButtonProps
	extends Omit<ClearFieldButtonInnerPublicProps, 'defaultValue'>,
		FieldPublicProps {
	label?: FormGroupProps['label']
}

export const ClearFieldButton = SimpleRelativeSingleField<ClearFieldButtonProps>(
	props => (
		<Field name={props.name}>
			{({ data, isMutating, environment, errors }): React.ReactNode => {
				if (!(data instanceof FieldAccessor)) {
					throw new DataBindingError(`Corrupted data`)
				}
				return (
					<FormGroup label={environment.applySystemMiddleware('labelMiddleware', props.label)} errors={errors}>
						<ClearFieldButtonInner field={data} isMutating={isMutating} />
					</FormGroup>
				)
			}}
		</Field>
	),
	'ClearFieldButton'
)
