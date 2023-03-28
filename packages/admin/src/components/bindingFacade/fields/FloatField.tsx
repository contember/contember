import { ControlProps, FloatInput } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	ControlValueParser,
	FieldValueFormatter,
	useFieldControl,
} from './useFieldControl'

export type FloatFieldProps =
	& SimpleRelativeSingleFieldProps
	& ControlProps<number>


const parse: ControlValueParser<number, number> = value => value ?? null
const format: FieldValueFormatter<number, number> = value => value ?? null

/**
 * @group Form Fields
 */
export const FloatField = SimpleRelativeSingleField<FloatFieldProps, number>(
	(fieldMetadata, props) => {
		const inputProps = useFieldControl<number, number>({
			...props,
			fieldMetadata,
			parse,
			format,
		})

		return <FloatInput {...inputProps} />
	},
	'FloatField',
)
