import * as React from 'react'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { ClearFieldButtonInner, ClearFieldButtonInnerPublicProps } from './ClearFieldButtonInner'

export type ClearFieldButtonProps = Omit<ClearFieldButtonInnerPublicProps, 'defaultValue'> &
	SimpleRelativeSingleFieldProps

export const ClearFieldButton = SimpleRelativeSingleField<ClearFieldButtonProps>(
	(fieldMetadata, props) => <ClearFieldButtonInner field={fieldMetadata.data} isMutating={fieldMetadata.isMutating} />,
	'ClearFieldButton',
)
