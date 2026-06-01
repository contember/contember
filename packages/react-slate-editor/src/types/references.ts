import { InsertElementWithReference } from '../plugins/references/useInsertElementWithReference.js'
import { CreateElementReferences } from '../plugins/references/useCreateElementReference.js'

export interface EditorReferenceMethods {
	insertElementWithReference: InsertElementWithReference
	createElementReference: CreateElementReferences
}
