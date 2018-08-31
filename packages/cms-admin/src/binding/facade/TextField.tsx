import { FormGroup, IFormGroupProps, InputGroup } from '@blueprintjs/core'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { FieldName } from '../bindingTypes'
import { FieldMarkerProvider } from '../coreComponents/DataMarkerProvider'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import Field from '../coreComponents/Field'
import FieldAccessor from '../dao/FieldAccessor'
import FieldMarker from '../dao/FieldMarker'

export interface TextFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
}

export default class TextField extends React.Component<TextFieldProps> {
	static displayName = 'TextField'

	public render() {
		return (
			<Field name={this.props.name}>
				{(data: FieldAccessor<string>): React.ReactNode => {
					return (
						<FormGroup label={this.props.label}>
							<InputGroup value={data.currentValue} onChange={this.generateOnChange(data)} />
						</FormGroup>
					)
				}}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<string>) => (e: ChangeEvent<HTMLInputElement>) => {
		data.onChange && data.onChange(e.target.value)
	}

	public static generateFieldMarker(props: TextFieldProps): FieldMarker {
		return new FieldMarker(props.name)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof TextField, FieldMarkerProvider>
