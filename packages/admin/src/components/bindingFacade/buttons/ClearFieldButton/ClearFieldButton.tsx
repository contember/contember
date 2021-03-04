import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { ClearFieldButtonInner, ClearFieldButtonInnerPublicProps } from './ClearFieldButtonInner'

export type ClearFieldButtonProps = Omit<ClearFieldButtonInnerPublicProps, 'defaultValue'> &
	SimpleRelativeSingleFieldProps

export const ClearFieldButton = SimpleRelativeSingleField<ClearFieldButtonProps>(
	(fieldMetadata, props) => <ClearFieldButtonInner field={fieldMetadata.field} isMutating={fieldMetadata.isMutating} />,
	'ClearFieldButton',
)
