import { Component, SugaredField, SugaredFieldProps } from '@contember/binding'
import * as React from 'react'
import { DiscriminatedBlocks } from '../../blocks'
import { Repeater, RepeaterProps } from '../../collections'
import {
	AggregateDataPopulatorProps,
	CustomDataPopulatorProps,
	resolvePopulators,
	useResolvedPopulators,
} from '../fileDataPopulators'
import { CustomFileKindProps } from './CustomFileKindProps'
import {
	FileRepeaterContainer,
	FileRepeaterContainerPrivateProps,
	FileRepeaterContainerPublicProps,
} from './FileRepeaterContainer'
import { StockFileKindProps } from './StockFileKindProps'
import { useResolvedFileKinds } from './useResolvedFileKinds'

type FileRepeaterProps = Omit<
	RepeaterProps<never, never>,
	| 'children'
	| 'containerComponent'
	| 'containerComponentExtraProps'
	| 'itemComponent'
	| 'itemComponentExtraProps'
	| 'unstable__sortAxis'
	| 'initialRowCount'
	| 'useDragHandle'
> &
	FileRepeaterContainerPublicProps & {
		children?: React.ReactNode
		discriminationField?: SugaredFieldProps['field']
	} & ((CustomDataPopulatorProps & CustomFileKindProps) | (AggregateDataPopulatorProps & StockFileKindProps))

// TODO configurable container/item components
export const FileRepeater = Component<FileRepeaterProps>(
	props => {
		const fileUrlField = 'fileUrlField' in props ? props.fileUrlField : undefined

		const fileDataPopulators = useResolvedPopulators(props)
		const fileKinds = useResolvedFileKinds(props, fileUrlField)

		// Using Required and exclamation marks to make sure we don't forget any props. This is still sound though.
		const containerExtraProps = React.useMemo((): Required<
			FileRepeaterContainerPublicProps & FileRepeaterContainerPrivateProps
		> => {
			return {
				accept: props.accept!,
				uploader: props.uploader!,
				hasPersistedFile: props.hasPersistedFile!,

				renderFile: props.renderFile!,
				renderFilePreview: props.renderFilePreview!,

				fileKinds,
				fileDataPopulators,
			}
		}, [
			fileDataPopulators,
			fileKinds,
			props.accept,
			props.hasPersistedFile,
			props.renderFile,
			props.renderFilePreview,
			props.uploader,
		])

		return (
			<Repeater
				{...props}
				containerComponent={FileRepeaterContainer}
				containerComponentExtraProps={containerExtraProps}
			>
				<></>
			</Repeater>
		)
	},
	(props, environment) => {
		let normalizedChildren: React.ReactNode = (
			<>
				{resolvePopulators(props).map((item, i) => (
					<React.Fragment key={i}>{item.getStaticFields(environment)}</React.Fragment>
				))}
				{props.discriminationField && <SugaredField field={props.discriminationField} />}

				{props.children}
			</>
		)

		if (props.discriminationField) {
			if (typeof props.discriminationField === 'string') {
				normalizedChildren = (
					<DiscriminatedBlocks label={props.label} field={props.discriminationField}>
						{normalizedChildren}
					</DiscriminatedBlocks>
				)
			} else {
				normalizedChildren = (
					<DiscriminatedBlocks label={props.label} {...props.discriminationField}>
						{normalizedChildren}
					</DiscriminatedBlocks>
				)
			}
		}

		return (
			<Repeater {...props} initialRowCount={0} useDragHandle={false}>
				{normalizedChildren}
			</Repeater>
		)
	},
	'FileRepeater',
)
