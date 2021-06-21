import { Entity, useGetEntityByKey, useMutationState } from '@contember/binding'
import type { FileId } from '@contember/react-client'
import type { FunctionComponent } from 'react'
import { ReactNode, useCallback } from 'react'
import { RepeaterContainerPrivateProps, SortableRepeaterItem } from '../../collections'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { FileInput, FileInputPublicProps } from './FileInput'
import { SingleFilePreview } from './SingleFilePreview'
import { useNormalizedUploadState } from './useNormalizedUploadState'

export interface BareFileRepeaterContainerPrivateProps {
	fileKinds: ResolvedFileKinds
}

export interface BareFileRepeaterContainerPublicProps extends FileInputPublicProps {}

export interface BareFileRepeaterContainerProps
	extends BareFileRepeaterContainerPublicProps,
		BareFileRepeaterContainerPrivateProps,
		RepeaterContainerPrivateProps {}

export const BareFileRepeaterContainer: FunctionComponent<BareFileRepeaterContainerProps> = ({
	entities,
	isEmpty,
	fileKinds,
	createNewEntity,

	// These are here just to remove them from the spread below
	accessor,
	children,
	formatMessage,

	...fileInputProps
}) => {
	const isMutating = useMutationState()
	const getEntityByKey = useGetEntityByKey()

	const { uploadState, dropzoneState, removeFile } = useNormalizedUploadState({
		isMultiple: true,
		fileKinds,
		prepareEntityForNewFile: createNewEntity,
	})

	const normalizedRemoveFile = useCallback(
		(entityKey: FileId) => {
			removeFile(entityKey)
			getEntityByKey(entityKey.toString()).deleteEntity()
		},
		[getEntityByKey, removeFile],
	)

	const previews: ReactNode[] = []
	for (const [i, entity] of entities.entries()) {
		const entityUploadState = uploadState.get(entity.key)

		// dragHandleComponent={props.useDragHandle ? sortableHandle : undefined}
		previews.push(
			<SortableRepeaterItem index={i} key={entity.key} disabled={isMutating}>
				<div className="fileInput-preview view-sortable">
					<Entity accessor={entity}>
						<SingleFilePreview
							getContainingEntity={entity.getAccessor}
							fileId={entity.key}
							removeFile={normalizedRemoveFile}
							uploadState={entityUploadState}
							fileKinds={fileKinds}
						/>
					</Entity>
				</div>
			</SortableRepeaterItem>,
		)
	}

	return (
		<FileInput
			{...fileInputProps}
			dropzoneState={dropzoneState}
			children={isEmpty && !previews.length ? undefined : previews}
		/>
	)
}
BareFileRepeaterContainer.displayName = 'BareFileRepeaterContainer'
