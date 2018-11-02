import { IFormGroupProps } from '@blueprintjs/core'
import * as React from 'react'
import RichEditor from '../../../components/RichEditor/index'
import { FieldName } from '../../bindingTypes'
import EnforceSubtypeRelation from '../../coreComponents/EnforceSubtypeRelation'
import Field from '../../coreComponents/Field'
import { SyntheticChildrenProvider } from '../../coreComponents/MarkerProvider'
import Environment from '../../dao/Environment'
import FieldAccessor from '../../dao/FieldAccessor'
import Parser from '../../queryLanguage/Parser'
import { TextFieldProps } from './TextField'

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
				{(data: FieldAccessor<string | null, string>): React.ReactNode => {
					return (
						<RichEditor
							onChange={this.generateOnChange(data)}
							value={data.currentValue || ''}
							allowLineBreaks={this.props.allowLineBreaks}
							label={this.props.label}
						/>
					)
				}}
			</Field>
		)
	}

	private generateOnChange = (data: FieldAccessor<string | null, string>) => (val: string) => {
		data.onChange && data.onChange(val)
	}

	public static generateSyntheticChildren(props: TextFieldProps, environment: Environment): React.ReactNode {
		return Parser.generateWrappedField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof RichTextField, SyntheticChildrenProvider>
