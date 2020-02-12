import { EntityAccessor } from '@contember/binding'
import { DesugaredGenericFileUploadProps } from './GenericFileUploadProps'

export const populateGenericFileMetadataFields = (
	parentEntity: EntityAccessor,
	file: File,
	props: DesugaredGenericFileUploadProps,
) =>
	parentEntity.batchUpdates(getAccessor => {
		if (props.fileNameField) {
			getAccessor()
				.getRelativeSingleField<string>(props.fileNameField)
				.updateValue?.(file.name)
		}
		if (props.lastModifiedField) {
			getAccessor()
				.getRelativeSingleField<number>(props.lastModifiedField)
				.updateValue?.(file.lastModified)
		}
		if (props.sizeField) {
			getAccessor()
				.getRelativeSingleField<number>(props.sizeField)
				.updateValue?.(file.size)
		}
		if (props.typeField) {
			getAccessor()
				.getRelativeSingleField<string>(props.typeField)
				.updateValue?.(file.type)
		}
	})
