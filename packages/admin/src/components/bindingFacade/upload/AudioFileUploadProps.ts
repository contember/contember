import { DesugaredRelativeSingleField, SugaredRelativeSingleField } from '@contember/binding'

export interface AudioFileUploadProps {
	durationField?: SugaredRelativeSingleField['field']
}

export interface DesugaredAudioFileUploadProps {
	durationField?: DesugaredRelativeSingleField
}
