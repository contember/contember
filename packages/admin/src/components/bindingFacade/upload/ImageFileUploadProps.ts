import { DesugaredRelativeSingleField, SugaredRelativeSingleField } from '@contember/binding'

export interface ImageFileUploadProps {
	widthField?: SugaredRelativeSingleField['field']
	heightField?: SugaredRelativeSingleField['field']
}

export interface DesugaredImageFileUploadProps {
	widthField?: DesugaredRelativeSingleField
	heightField?: DesugaredRelativeSingleField
}
