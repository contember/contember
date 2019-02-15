import * as React from 'react'

export interface FileInputProps {
	onChange?: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>['onChange']
}

export const FileInput: React.FunctionComponent<FileInputProps> = props => (
	<label className="fileInput">
		<input className="fileInput-input" type="file" onChange={props.onChange} />
		<span className="fileInput-label">{props.children}</span>
	</label>
)
