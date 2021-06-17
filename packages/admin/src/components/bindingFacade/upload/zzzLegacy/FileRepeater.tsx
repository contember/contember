// import { Component, SugaredField, SugaredFieldProps } from '@contember/binding'
// import { Fragment, FunctionComponent, ReactNode, useMemo } from 'react'
// import { DiscriminatedBlocks, useNormalizedBlocks } from '../../blocks'
// import { Repeater, RepeaterProps } from '../../collections'
// import {
// 	AggregateDataPopulatorProps,
// 	CustomDataPopulatorProps,
// 	FileUrlDataPopulatorProps,
// 	resolvePopulators,
// 	useResolvedPopulators,
// } from '../fileDataPopulators'
// import type { CustomFileKindProps } from './CustomFileKindProps'
// import {
// 	FileRepeaterContainer,
// 	FileRepeaterContainerPrivateProps,
// 	FileRepeaterContainerPublicProps,
// } from './FileRepeaterContainer'
// import type { StockFileKindProps } from './StockFileKindProps'
// import { resolveFileKinds, useResolvedFileKinds } from './useResolvedFileKinds'
//
// type FileRepeaterProps = Omit<
// 	RepeaterProps<never, never>,
// 	| 'children'
// 	| 'containerComponent'
// 	| 'containerComponentExtraProps'
// 	| 'itemComponent'
// 	| 'itemComponentExtraProps'
// 	| 'unstable__sortAxis'
// 	| 'initialEntityCount'
// 	| 'useDragHandle'
// > &
// 	FileRepeaterContainerPublicProps & {
// 		children?: ReactNode
// 		discriminationField?: SugaredFieldProps['field']
// 	} & ((CustomDataPopulatorProps & CustomFileKindProps) | (AggregateDataPopulatorProps & StockFileKindProps))
//
// // TODO configurable container/item components
// export const FileRepeater: FunctionComponent<FileRepeaterProps> = Component(
// 	props => {
// 		const fileUrlProps = props as Partial<FileUrlDataPopulatorProps>
//
// 		const fileDataPopulators = useResolvedPopulators(props)
// 		const fileKinds = useResolvedFileKinds(props, fileUrlProps)
// 		const normalizedBlocks = useNormalizedBlocks(props.children)
//
// 		// Using Required and exclamation marks to make sure we don't forget any props. This is still sound though.
// 		const containerExtraProps = useMemo((): Required<
// 			FileRepeaterContainerPublicProps & FileRepeaterContainerPrivateProps
// 		> => {
// 			return {
// 				uploader: props.uploader!,
//
// 				renderFile: props.renderFile!,
// 				renderFilePreview: props.renderFilePreview!,
//
// 				discriminationField: props.discriminationField!,
// 				removalType: props.removalType!,
// 				addButtonSubText: props.addButtonSubText!,
//
// 				fileUrlField: fileUrlProps.fileUrlField!,
// 				audioFileUrlField: fileUrlProps.audioFileUrlField!,
// 				imageFileUrlField: fileUrlProps.imageFileUrlField!,
// 				videoFileUrlField: fileUrlProps.videoFileUrlField!,
//
// 				description: props.description!,
// 				labelDescription: props.labelDescription!,
//
// 				fileKinds,
// 				fileDataPopulators,
// 				normalizedBlocks,
// 			}
// 		}, [
// 			fileKinds,
// 			fileDataPopulators,
// 			normalizedBlocks,
// 			props.uploader,
// 			props.renderFile,
// 			props.renderFilePreview,
// 			props.discriminationField,
// 			props.removalType,
// 			props.addButtonSubText,
// 			props.description,
// 			props.labelDescription,
// 			fileUrlProps.fileUrlField,
// 			fileUrlProps.audioFileUrlField,
// 			fileUrlProps.imageFileUrlField,
// 			fileUrlProps.videoFileUrlField,
// 		])
//
// 		return (
// 			<Repeater
// 				{...props}
// 				initialEntityCount={0}
// 				useDragHandle={false}
// 				containerComponent={FileRepeaterContainer}
// 				containerComponentExtraProps={containerExtraProps}
// 				unstable__sortAxis="xy"
// 			>
// 				<></>
// 			</Repeater>
// 		)
// 	},
// 	(props, environment) => {
// 		const fileKinds = Array.from(resolveFileKinds(props, props as Partial<FileUrlDataPopulatorProps>))
// 		let normalizedChildren: ReactNode = (
// 			<>
// 				{resolvePopulators(props).map((item, i) => (
// 					<Fragment key={i}>{item.getStaticFields(environment)}</Fragment>
// 				))}
// 				{fileKinds.map((item, i) => (
// 					<Fragment key={i}>{item.renderFile?.()}</Fragment>
// 				))}
// 				{props.discriminationField && <SugaredField field={props.discriminationField} />}
//
// 				{props.children}
// 			</>
// 		)
//
// 		if (props.discriminationField) {
// 			if (typeof props.discriminationField === 'string') {
// 				normalizedChildren = (
// 					<DiscriminatedBlocks label={props.label} field={props.discriminationField}>
// 						{normalizedChildren}
// 					</DiscriminatedBlocks>
// 				)
// 			} else {
// 				normalizedChildren = (
// 					<DiscriminatedBlocks label={props.label} {...props.discriminationField}>
// 						{normalizedChildren}
// 					</DiscriminatedBlocks>
// 				)
// 			}
// 		}
//
// 		return (
// 			<Repeater {...props} initialEntityCount={0}>
// 				{normalizedChildren}
// 			</Repeater>
// 		)
// 	},
// 	'FileRepeater',
// )
export {}
