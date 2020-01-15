import { EntityAccessor, getRelativeSingleField } from '@contember/binding'
import { DesugaredGenericFileUploadProps } from './GenericFileUploadProps'

export const populateGenericFileMetadataFields = (
	parentEntity: EntityAccessor,
	file: File,
	props: DesugaredGenericFileUploadProps,
) =>
	parentEntity.batchUpdates?.(getAccessor => {
		if (props.fileNameField) {
			getRelativeSingleField<string>(getAccessor(), props.fileNameField).updateValue?.(file.name)
		}
		if (props.lastModifiedField) {
			getRelativeSingleField<number>(getAccessor(), props.lastModifiedField).updateValue?.(file.lastModified)
		}
		if (props.sizeField) {
			getRelativeSingleField<number>(getAccessor(), props.sizeField).updateValue?.(file.size)
		}
		if (props.typeField) {
			getRelativeSingleField<string>(getAccessor(), props.typeField).updateValue?.(file.type)
		}
	})
