import { DesugaredRelativeSingleField, SugaredRelativeSingleField } from '@contember/binding'

export interface GenericFileUploadProps {
	fileNameField?: SugaredRelativeSingleField['field']
	lastModifiedField?: SugaredRelativeSingleField['field']
	sizeField?: SugaredRelativeSingleField['field']
	typeField?: SugaredRelativeSingleField['field']
}

export interface DesugaredGenericFileUploadProps {
	fileNameField?: DesugaredRelativeSingleField
	lastModifiedField?: DesugaredRelativeSingleField
	sizeField?: DesugaredRelativeSingleField
	typeField?: DesugaredRelativeSingleField
}
