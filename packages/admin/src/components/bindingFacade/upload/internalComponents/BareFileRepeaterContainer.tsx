import {
	EntityAccessor, FieldValue,
	QueryLanguage,
	SugaredFieldProps, useEnvironment,
	useGetEntityByKey,
	useMutationState,
} from '@contember/binding'
import type { FileId } from '@contember/react-client'
import { FunctionComponent, ReactNode, useCallback, useState } from 'react'
import { useMessageFormatter } from '../../../../i18n'
import { RepeaterFieldContainerPrivateProps, SortableRepeaterItem } from '../../collections'
import { useAccessorErrors } from '../../errors'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { uploadDictionary } from '../uploadDictionary'
import { FileInput, FileInputPublicProps } from './FileInput'
import { SingleFilePreview } from './SingleFilePreview'
import { useNormalizedUploadState } from '../hooks/useNormalizedUploadState'
import { useConnectSelectedEntities } from '../hooks/useConnectSelectedEntities'
import { useFileUpload } from '@contember/react-client'
import { useFileEntitiesErrors } from '../hooks/useFileEntitiesErrors'

export interface BareFileRepeaterContainerPrivateProps {
	fileKinds: ResolvedFileKinds
	sortableBy?: SugaredFieldProps['field']
}

export type BareFileRepeaterContainerPublicProps =
	& FileInputPublicProps
	& {
		boxLabel?: ReactNode
		label: ReactNode
	}

export type BareFileRepeaterContainerProps =
	& BareFileRepeaterContainerPublicProps
	& BareFileRepeaterContainerPrivateProps
	& RepeaterFieldContainerPrivateProps

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

	const fileUpload = useFileUpload()
	const [, { purgeUpload }] = fileUpload
	const { uploadState, dropzoneState } = useNormalizedUploadState({
		isMultiple: true,
		fileKinds,
		prepareEntityForNewFile: createNewEntity,
		fileUpload,
	})

	const normalizedRemoveFile = useCallback(
		(entityKey: FileId) => {
			purgeUpload([entityKey])
			getEntityByKey(entityKey.toString()).deleteEntity()
		},
		[getEntityByKey, purgeUpload],
	)
	const errors = [...useFileEntitiesErrors(entities, fileKinds), ...(useAccessorErrors(accessor) ?? [])]
	const previews: ReactNode[] = []
	for (const [i, entity] of entities.entries()) {
		const entityUploadState = uploadState.get(entity.key)
		const preview = (
			<SingleFilePreview
				containingEntity={entity}
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

	const onSelectConfirm = useConnectSelectedEntities(fileKinds, createNewEntity)

	return (
		<FileInput
			{...fileInputProps}
			fileKinds={fileKinds}
			isMultiple={true}
			label={label}
			dropzoneState={dropzoneState}
			formatMessage={formatMessage}
			errors={errors}
			children={isEmpty && !previews.length ? undefined : previews}
			onSelectConfirm={onSelectConfirm}
		/>
	)
}
BareFileRepeaterContainer.displayName = 'BareFileRepeaterContainer'
