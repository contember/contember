import {
	EntityAccessor,
	Environment,
	RelativeSingleField,
	RemovalType,
	SingleEntity,
	VariableInputTransformer,
} from '@contember/binding'
import { SingleFileUploadState } from '@contember/react-client'
import { ActionableBox, Box } from '@contember/ui'
import * as React from 'react'
import { getDiscriminatedBlock, NormalizedBlocks } from '../../blocks'
import { UploadedFilePreview, UploadingFilePreview } from '../core'
import { FileDataPopulator } from '../fileDataPopulators'
import { DiscriminatedFileUploadProps } from './DiscriminatedFileUploadProps'

export interface FileRepeaterItemProps {
	canBeRemoved: boolean
	defaultFileKind: DiscriminatedFileUploadProps
	desugaredDiscriminant: RelativeSingleField | undefined
	entity: EntityAccessor
	environment: Environment
	fileDataPopulators: Iterable<FileDataPopulator>
	fileKinds: DiscriminatedFileUploadProps[]
	normalizedBlocks: NormalizedBlocks
	removalType?: RemovalType
	uploadingState: SingleFileUploadState | undefined
}

export const FileRepeaterItem = React.memo(
	({
		canBeRemoved,
		defaultFileKind,
		desugaredDiscriminant,
		entity,
		environment,
		fileDataPopulators,
		fileKinds,
		normalizedBlocks,
		uploadingState,
	}: FileRepeaterItemProps) => {
		let resolvedFileKind: Partial<DiscriminatedFileUploadProps> = defaultFileKind
		let editContents: React.ReactNode = undefined

		if (desugaredDiscriminant) {
			const discriminantField = entity.getRelativeSingleField(desugaredDiscriminant)
			const acceptingFileKind: DiscriminatedFileUploadProps | undefined = fileKinds.find(
				fileKind =>
					(fileKind.discriminateBy !== undefined &&
						discriminantField.hasValue(
							VariableInputTransformer.transformVariableLiteral(fileKind.discriminateBy, environment),
						)) ||
					(fileKind.discriminateByScalar !== undefined && discriminantField.hasValue(fileKind.discriminateByScalar)),
			)
			if (acceptingFileKind) {
				resolvedFileKind = acceptingFileKind
			}

			const relevantBlock = getDiscriminatedBlock(normalizedBlocks, discriminantField)

			if (relevantBlock !== undefined) {
				editContents = (
					<div>
						<Box heading={relevantBlock.data.label}>{relevantBlock.data.children}</Box>
					</div>
				)
			}
		}

		const preview = uploadingState ? (
			<UploadingFilePreview
				uploadState={uploadingState}
				batchUpdates={entity.batchUpdates}
				renderFilePreview={resolvedFileKind.renderFilePreview || defaultFileKind.renderFilePreview}
				environment={environment}
				populators={fileDataPopulators}
			/>
		) : (
			<UploadedFilePreview renderFile={resolvedFileKind.renderFile || defaultFileKind.renderFile} />
		)

		const deleteEntity = entity.deleteEntity
		const onRemove = React.useCallback(
			(e: React.MouseEvent) => {
				e.stopPropagation()
				deleteEntity?.()
			},
			[deleteEntity],
		)

		return (
			<div className="fileInput-preview">
				<SingleEntity accessor={entity}>
					<ActionableBox onRemove={canBeRemoved ? onRemove : undefined} editContents={editContents}>
						{preview}
					</ActionableBox>
				</SingleEntity>
			</div>
		)
	},
)
