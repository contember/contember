import * as React from 'react'
import { Avatar, AvatarProps } from '../../index'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../../binding/coreComponents'
import { Environment } from '../../../binding/dao'
import { QueryLanguage } from '../../../binding/queryLanguage'
import { TextFieldProps } from '../fields'

interface AvatarFieldProps {
	name: string
	size?: AvatarProps['size']
	shape?: AvatarProps['shape']
}

export class AvatarField extends React.PureComponent<AvatarFieldProps> {
	public static displayName = 'AvatarField'

	public render() {
		return (
			<Field<string> name={this.props.name}>
				{({ data }) => (
					<Avatar size={this.props.size} shape={this.props.shape}>
						{data.currentValue &&
							data.currentValue
								.split(/\s+/)
								.slice(0, 2)
								.map(s => s.charAt(0).toLocaleUpperCase())
								.join('')}
					</Avatar>
				)}
			</Field>
		)
	}

	public static generateSyntheticChildren(props: AvatarFieldProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof AvatarField,
	SyntheticChildrenProvider<AvatarFieldProps>
>
