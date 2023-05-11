import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { ClearFieldButtonInner, ClearFieldButtonInnerPublicProps } from './ClearFieldButtonInner'

export type ClearFieldButtonProps =
	& SimpleRelativeSingleFieldProps
	& ClearFieldButtonInnerPublicProps

/**
 * Renders a button which clears the fields specified in a "field" prop on a click.
 *
 * @example
 * ```
 * <ClearFieldButton field="name" label="Clear name" />
 * ```
 *
 * @group Action buttons
 */
export const ClearFieldButton = SimpleRelativeSingleField<ClearFieldButtonProps>(
	(fieldMetadata, props) => <ClearFieldButtonInner field={fieldMetadata.field} isMutating={fieldMetadata.isMutating} />,
	'ClearFieldButton',
)
