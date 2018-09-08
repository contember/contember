import { FormGroup, IFormGroupProps, InputGroup, TextArea, ITextAreaProps } from '@blueprintjs/core'
import * as React from 'react'
import { ChangeEvent } from 'react'
import { FieldName } from '../bindingTypes'
import { FieldMarkerProvider } from '../coreComponents/DataMarkerProvider'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import Field from '../coreComponents/Field'
import FieldAccessor from '../dao/FieldAccessor'
import FieldMarker from '../dao/FieldMarker'
import RichEditor from '../../components/RichEditor'

export interface RichTextFieldProps {
	name: FieldName
	label?: IFormGroupProps['label']
	allowLineBreaks?: boolean
}

export default class RichTextField extends React.Component<RichTextFieldProps> {
	static displayName = 'RichTextField'

	public render() {
		return (
			<Field name={this.props.name}>
				{(data: FieldAccessor<string>): React.ReactNode => {
					return (
						<RichEditor
							onChange={this.generateOnChange(data)}
							value={data.currentValue}
							allowLineBreaks={this.props.allowLineBreaks}
						/>
					)
				}}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<string>) => (val: string) => {
		data.onChange && data.onChange(val)
	}

	public static generateFieldMarker(props: RichTextFieldProps): FieldMarker {
		return new FieldMarker(props.name)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof RichTextField, FieldMarkerProvider>
