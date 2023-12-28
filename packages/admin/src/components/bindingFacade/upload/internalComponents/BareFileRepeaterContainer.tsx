import { SugaredFieldProps, useGetEntityByKey, useMutationState } from '@contember/react-binding'
import type { FileId } from '@contember/react-client'
import { useFileUpload } from '@contember/react-client'
import { FunctionComponent, ReactNode, useCallback, useMemo } from 'react'
import { useMessageFormatter } from '@contember/react-i18n'
import { RepeaterFieldContainerPrivateProps, SortableRepeaterItem } from '../../collections'
import { useAccessorErrorFormatter } from '@contember/react-binding-ui'
import { FileHandler } from '../fileHandler'
import { uploadDictionary } from '../uploadDictionary'
import { FileInput, FileInputPublicProps } from './FileInput'
import { SingleFilePreview } from './SingleFilePreview'
import { useConnectSelectedEntities } from './hooks/useConnectSelectedEntities'
import { useNormalizedUploadState } from './hooks/useNormalizedUploadState'
import { SelectFileInputSelectionComponentProps } from './selection'

export interface BareFileRepeaterContainerPrivateProps {
	fileHandler: FileHandler
	sortableBy?: SugaredFieldProps['field']
}

export interface BareFileRepeaterContainerPublicProps extends Omit<FileInputPublicProps, 'label'> {
	label: ReactNode
}

export type BareFileRepeaterContainerProps =
	& BareFileRepeaterContainerPublicProps
	& BareFileRepeaterContainerPrivateProps
	& RepeaterFieldContainerPrivateProps
	& SelectFileInputSelectionComponentProps<{}>

export const BareFileRepeaterContainer: FunctionComponent<BareFileRepeaterContainerProps> = ({
	accessor,
	entities,
	isEmpty,
	label,
	fileHandler,
	createNewEntity,
	sortableBy,

	// These are here just to remove them from the spread below
	children,
	formatMessage: _,

	...fileInputProps
}) => {
	const isMutating = useMutationState()
	const getEntityByKey = useGetEntityByKey()
	const formatMessage = useMessageFormatter(uploadDictionary)

	const fileUpload = useFileUpload()
	const [, { purgeUpload }] = fileUpload
	const { uploadState, dropzoneState } = useNormalizedUploadState({
		isMultiple: true,
		fileHandler,
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
	const resolvedEntities = useMemo(() => {
		return Object.values(entities).map(it => fileHandler.resolveEntity(it))
	}, [entities, fileHandler])

	const fileErrorsHolders = useMemo(() => {
		return [accessor, ...resolvedEntities.flatMap(it => it.getErrorHolders())]
	}, [accessor, resolvedEntities])
	const errorFormatter = useAccessorErrorFormatter()
	const errors = useMemo(() => {
		return errorFormatter(fileErrorsHolders.flatMap(it => it.errors?.errors ?? []))
	}, [errorFormatter, fileErrorsHolders])

	const previews: ReactNode[] = []
	for (const [i, entity] of resolvedEntities.entries()) {
		const fileKey = entity.parentEntity.key
		const entityUploadState = uploadState.get(fileKey)
		const preview = (
			<SingleFilePreview
				resolvedEntity={entity}
				fileId={fileKey}
				formatMessage={formatMessage}
				removeFile={normalizedRemoveFile}
				uploadState={entityUploadState}
			/>
		)

		if (sortableBy === undefined) {
			previews.push(
				<div key={entity.parentEntity.key} className="fileInput-preview">
					{preview}
				</div>,
			)
		} else {
			previews.push(
				<SortableRepeaterItem index={i} key={entity.parentEntity.key} disabled={isMutating}>
					<div data-sortable className="fileInput-preview">{preview}</div>
				</SortableRepeaterItem>,
			)
		}
	}

	const onSelectConfirm = useConnectSelectedEntities(createNewEntity)

	return (
		<FileInput
			{...fileInputProps}
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
