import { FormGroup, IFormGroupProps, InputGroup, TextArea, ITextAreaProps } from '@blueprintjs/core'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { FieldName } from '../bindingTypes'
import { FieldMarkerProvider } from '../coreComponents/MarkerProvider'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import Field from '../coreComponents/Field'
import FieldAccessor from '../dao/FieldAccessor'
import FieldMarker from '../dao/FieldMarker'

export interface TextAreaFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	large?: boolean
	singleLine?: boolean
}

export default class TextAreaField extends React.Component<TextAreaFieldProps> {
	static displayName = 'TextAreaField'

	public render() {
		return (
			<Field name={this.props.name}>
				{(data: FieldAccessor<string>): React.ReactNode => {
					return (
						<FormGroup label={this.props.label}>
							<TextArea
								value={data.currentValue}
								onChange={this.generateOnChange(data)}
								large={this.props.large}
								fill={true}
							/>
						</FormGroup>
					)
				}}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<string>) => (e: ChangeEvent<HTMLTextAreaElement>) => {
		const str = this.props.singleLine ? e.target.value.replace(/\n/g, ' ') : e.target.value
		data.onChange && data.onChange(str)
	}

	public static generateFieldMarker(props: TextAreaFieldProps): FieldMarker {
		return new FieldMarker(props.name)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof TextAreaField, FieldMarkerProvider>
