import * as React from 'react'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { TextFieldProps } from '../fields'
import { Avatar, AvatarProps } from '../../../components'

interface AvatarFieldProps {
	name: string
	size?: AvatarProps['size']
	shape?: AvatarProps['shape']
}

export class AvatarField extends React.PureComponent<AvatarFieldProps> {
	public static displayName = 'AvatarField'

	public render() {
		return (
			<Field name={this.props.name}>
				{(data: FieldAccessor) => (
					<Avatar size={this.props.size} shape={this.props.shape}>
						{data.currentValue &&
							data.currentValue
								.toString()
								.split(' ')
								.map(s => s.charAt(0).toLocaleUpperCase())
								.join('')
								.substring(0, 2)}
					</Avatar>
				)}
			</Field>
		)
	}

	public static generateSyntheticChildren(props: TextFieldProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof AvatarField,
	SyntheticChildrenProvider<AvatarFieldProps>
>
