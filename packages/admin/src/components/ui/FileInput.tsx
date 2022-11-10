import type { DetailedHTMLProps, FunctionComponent, InputHTMLAttributes } from 'react'
import { ReactNode } from 'react'

export interface FileInputProps {
	onChange?: DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>['onChange']
	children?: ReactNode
}

export const FileInput: FunctionComponent<FileInputProps> = props => (
	<label className="fileInput">
		<input className="fileInput-input" type="file" onChange={props.onChange} />
		<span className="fileInput-label">{props.children}</span>
	</label>
)
