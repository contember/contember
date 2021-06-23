import type {
	DataGridCellsDictionary,
	DataGridDictionary,
	ErrorCodeDictionary,
	FieldViewDictionary,
	PersistFeedbackDictionary,
	RepeaterDictionary,
	UploadDictionary,
} from './components'

// This isn't in i18n in order to avoid unnecessary circular imports.

// This should ideally be a complete list of all individual dictionaries throughout the entire package.
// That way, translation packages can implement this and have TS warn them about missing messages.
export type AdminDictionary = DataGridCellsDictionary &
	DataGridDictionary &
	ErrorCodeDictionary &
	FieldViewDictionary &
	PersistFeedbackDictionary &
	RepeaterDictionary &
	UploadDictionary
