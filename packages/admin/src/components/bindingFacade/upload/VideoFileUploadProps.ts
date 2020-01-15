import { DesugaredRelativeSingleField, SugaredRelativeSingleField } from '@contember/binding'

export interface VideoFileUploadProps {
	widthField?: SugaredRelativeSingleField['field']
	heightField?: SugaredRelativeSingleField['field']
	durationField?: SugaredRelativeSingleField['field']
}

export interface DesugaredVideoFileUploadProps {
	widthField?: DesugaredRelativeSingleField
	heightField?: DesugaredRelativeSingleField
	durationField?: DesugaredRelativeSingleField
}
