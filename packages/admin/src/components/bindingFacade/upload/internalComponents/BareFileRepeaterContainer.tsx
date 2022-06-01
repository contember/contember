import { SugaredFieldProps, useGetEntityByKey, useMutationState } from '@contember/binding'
import type { FileId } from '@contember/react-client'
import { FunctionComponent, ReactNode, useCallback, useState } from 'react'
import { useMessageFormatter } from '../../../../i18n'
import { RepeaterFieldContainerPrivateProps, SortableRepeaterItem } from '../../collections'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { uploadDictionary } from '../uploadDictionary'
import { FileInput, FileInputPublicProps } from './FileInput'
import { SingleFilePreview } from './SingleFilePreview'
import { useNormalizedUploadState } from './useNormalizedUploadState'
import { useAccessorErrors } from '../../errors'

export interface BareFileRepeaterContainerPrivateProps {
	fileKinds: ResolvedFileKinds
	sortableBy?: SugaredFieldProps['field']
}

export interface BareFileRepeaterContainerPublicProps extends Omit<FileInputPublicProps, 'label'> {
	boxLabel?: ReactNode
	label: ReactNode
}

export interface BareFileRepeaterContainerProps
	extends BareFileRepeaterContainerPublicProps,
		BareFileRepeaterContainerPrivateProps,
		RepeaterFieldContainerPrivateProps {}

export const BareFileRepeaterContainer: FunctionComponent<BareFileRepeaterContainerProps> = ({
	accessor,
	entities,
	isEmpty,
	label,
	fileKinds: unstableFileKinds,
	createNewEntity,
	sortableBy,

	// These are here just to remove them from the spread below
	children,
	formatMessage: _,

	...fileInputProps
}) => {
	const isMutating = useMutationState()
	const getEntityByKey = useGetEntityByKey()
	const [fileKinds] = useState(() => unstableFileKinds)
	const formatMessage = useMessageFormatter(uploadDictionary)

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
	const errors = useAccessorErrors(accessor)

	const previews: ReactNode[] = []
	for (const [i, entity] of entities.entries()) {
		const entityUploadState = uploadState.get(entity.key)
		const preview = (
			<SingleFilePreview
				getContainingEntity={entity.getAccessor}
				fileId={entity.key}
				formatMessage={formatMessage}
				removeFile={normalizedRemoveFile}
				uploadState={entityUploadState}
				fileKinds={fileKinds}
			/>
		)

		if (sortableBy === undefined) {
			previews.push(
				<div key={entity.id ?? entity.key} className="fileInput-preview">
					{preview}
				</div>,
			)
		} else {
			previews.push(
				<SortableRepeaterItem index={i} key={entity.id ?? entity.key} disabled={isMutating}>
					<div className="fileInput-preview view-sortable">{preview}</div>
				</SortableRepeaterItem>,
			)
		}
	}

	return (
		<FileInput
			{...fileInputProps}
			label={label}
			dropzoneState={dropzoneState}
			formatMessage={formatMessage}
			errors={errors}
			children={isEmpty && !previews.length ? undefined : previews}
		/>
	)
}
BareFileRepeaterContainer.displayName = 'BareFileRepeaterContainer'
