import { TextInputOwnProps } from '../TextInput'

export type DateTimeInputProps = Omit<TextInputOwnProps, 'onChange'> & {
	className?: string
	onChange: (value: string | null) => void,
	type: 'date' | 'time' | 'datetime'
	min?: string
	max?: string
}
