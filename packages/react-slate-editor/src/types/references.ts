import { InsertElementWithReference } from '../plugins/references/useInsertElementWithReference'
import { CreateElementReferences } from '../plugins/references/useCreateElementReference'

export interface EditorReferenceMethods {
	insertElementWithReference: InsertElementWithReference
	createElementReference: CreateElementReferences
}
