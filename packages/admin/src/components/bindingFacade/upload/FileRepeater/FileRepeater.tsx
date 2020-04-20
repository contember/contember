import { Component, SugaredField, SugaredFieldProps } from '@contember/binding'
import * as React from 'react'
import { DiscriminatedBlocks } from '../../blocks'
import { Repeater, RepeaterProps } from '../../collections'
import {
	AggregateDataPopulatorProps,
	CustomDataPopulatorProps,
	FileUrlDataPopulatorProps,
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
import { resolveFileKinds, useResolvedFileKinds } from './useResolvedFileKinds'

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
		const fileUrlProps = props as Partial<FileUrlDataPopulatorProps>

		const fileDataPopulators = useResolvedPopulators(props)
		const fileKinds = useResolvedFileKinds(props, fileUrlProps)

		// Using Required and exclamation marks to make sure we don't forget any props. This is still sound though.
		const containerExtraProps = React.useMemo((): Required<
			FileRepeaterContainerPublicProps & FileRepeaterContainerPrivateProps
		> => {
			return {
				uploader: props.uploader!,

				renderFile: props.renderFile!,
				renderFilePreview: props.renderFilePreview!,

				discriminationField: props.discriminationField!,

				fileUrlField: fileUrlProps.fileUrlField!,
				audioFileUrlField: fileUrlProps.audioFileUrlField!,
				imageFileUrlField: fileUrlProps.imageFileUrlField!,
				videoFileUrlField: fileUrlProps.videoFileUrlField!,

				fileKinds,
				fileDataPopulators,
			}
		}, [
			fileDataPopulators,
			fileKinds,
			fileUrlProps.audioFileUrlField,
			fileUrlProps.fileUrlField,
			fileUrlProps.imageFileUrlField,
			fileUrlProps.videoFileUrlField,
			props.discriminationField,
			props.renderFile,
			props.renderFilePreview,
			props.uploader,
		])

		return (
			<Repeater
				{...props}
				initialRowCount={0}
				//useDragHandle={false}
				containerComponent={FileRepeaterContainer}
				containerComponentExtraProps={containerExtraProps}
				unstable__sortAxis="xy"
			>
				<></>
			</Repeater>
		)
	},
	(props, environment) => {
		const fileKinds = Array.from(resolveFileKinds(props, props as Partial<FileUrlDataPopulatorProps>))
		let normalizedChildren: React.ReactNode = (
			<>
				{resolvePopulators(props).map((item, i) => (
					<React.Fragment key={i}>{item.getStaticFields(environment)}</React.Fragment>
				))}
				{fileKinds.map((item, i) => (
					<React.Fragment key={i}>{item.renderFile?.()}</React.Fragment>
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
			<Repeater {...props} initialRowCount={0}>
				{normalizedChildren}
			</Repeater>
		)
	},
	'FileRepeater',
)
