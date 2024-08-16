import { useUploadState } from '../internal/hooks/useUploadState'
import { useUploaderDoUpload } from '../internal/hooks/useUploaderDoUpload'
import { UploaderOptionsContext, UploaderStateContext, UploaderUploadFilesContext } from '../contexts'
import { Fragment, ReactNode, useMemo } from 'react'
import { Component, Field, SugaredRelativeSingleEntity } from '@contember/react-binding'
import { DiscriminatedFileTypeMap } from '../types'
import { SugaredRelativeSingleField } from '@contember/binding'
import { useFillDiscriminatedEntity } from '../internal/hooks/useFillDiscriminatedEntity'
import { uploaderErrorHandler } from '../internal/utils/uploaderErrorHandler'
import { resolveAllAcceptedMimes } from '../internal/utils/resolveAllAcceptedMimes'
import { UploaderBase } from './UploaderBase'

export type DiscriminatedUploaderProps = {
	baseField?: SugaredRelativeSingleEntity['field']
	discriminatorField: SugaredRelativeSingleField['field']
	children: ReactNode
	types: DiscriminatedFileTypeMap
}

export const DiscriminatedUploader = Component<DiscriminatedUploaderProps>(({ baseField, types, children, discriminatorField }) => {
	const fillEntityEvents = useFillDiscriminatedEntity({
		baseField,
		onError: uploaderErrorHandler,
		discriminatorField,
		types,
	})
	const { files, ...stateEvents } = useUploadState(fillEntityEvents)

	const onDrop = useUploaderDoUpload(stateEvents)
	const options = useMemo(() => ({
		multiple: false,
		accept: resolveAllAcceptedMimes(Object.values(types).map(it => it.accept)),
	}), [types])


	return (
		<UploaderStateContext.Provider value={files}>
			<UploaderUploadFilesContext.Provider value={onDrop}>
				<UploaderOptionsContext.Provider value={options}>
					{children}
				</UploaderOptionsContext.Provider>
			</UploaderUploadFilesContext.Provider>
		</UploaderStateContext.Provider>
	)
}, ({ baseField, types, discriminatorField }, environment) => {
	return (
		<UploaderBase baseField={baseField}>
			<Field field={discriminatorField} />
			{Object.entries(types).map(([key, fileType]) => {
				return (
					<UploaderBase baseField={fileType.baseField} key={key}>
						{fileType.extractors?.map((extractor, i) => <Fragment key={i}>{extractor.staticRender({ environment })}</Fragment>)}
					</UploaderBase>
				)
			})}
		</UploaderBase>
	)
})
