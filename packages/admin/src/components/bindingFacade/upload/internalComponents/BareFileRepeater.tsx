import { Component, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ComponentType } from 'react'
import { Repeater } from '../../collections'
import {
	BareFileRepeaterContainer,
	BareFileRepeaterContainerPrivateProps,
	BareFileRepeaterContainerPublicProps,
} from './BareFileRepeaterContainer'
import { FileHandler } from '../fileHandler'
import { SelectFileInputSelectionComponentProps } from './selection'
import { ResolvedFileSelectionComponent } from './selection'

export type BareFileRepeaterProps =
	& SugaredRelativeEntityList
	& BareFileRepeaterContainerPublicProps
	& SelectFileInputSelectionComponentProps<{}>
	& {
		sortableBy?: SugaredFieldProps['field']
		fileHandler: FileHandler
		fileSelection?: ResolvedFileSelectionComponent<any>
	}

export const BareFileRepeater: ComponentType<BareFileRepeaterProps> = Component<BareFileRepeaterProps>(
	props => (
		<Repeater<BareFileRepeaterContainerPrivateProps, any>
			{...props}
			initialEntityCount={0}
			useDragHandle={false}
			containerComponent={BareFileRepeaterContainer}
			unstable__sortAxis="xy"
		/>
	),
	(props, environment) => {
		return (
			<Repeater {...props} initialEntityCount={0}>
				{props.fileHandler.staticRender(environment)}
			</Repeater>
		)
	},
	'BareFileRepeater',
)
