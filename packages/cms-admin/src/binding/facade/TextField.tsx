import * as React from 'react'
import { ChangeEvent } from 'react'
import { FieldName } from '../bindingTypes'
import Field from '../coreComponents/Field'
import FieldAccessor from '../dao/FieldAccessor'


export interface TextFieldProps {
	name: FieldName
}


export default class TextField extends React.Component<TextFieldProps> {

	public render() {
		return <Field name={this.props.name}>
			{(data: FieldAccessor<string>): React.ReactNode => {
				return <div>
					<input type={'text'} value={data.currentValue} onChange={this.generateOnChange(data)}/>
				</div>
			}}
		</Field>
	}


	private generateOnChange = (data: FieldAccessor<string>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange(e.target.value)
	}
}
