import { createRequiredContext } from '@contember/react-utils'
import { GetReferencedEntity } from './plugins/references/useGetReferencedEntity'
import { EditorReferenceMethods } from './types'
import { RenderElementProps } from 'slate-react'

const EditorGetReferencedEntityContext_ = createRequiredContext<GetReferencedEntity>('EditorGetReferenceEntityContext')
/** @internal */
export const EditorGetReferencedEntityContext = EditorGetReferencedEntityContext_[0]
export const useEditorGetReferencedEntity = EditorGetReferencedEntityContext_[1]

const EditorReferenceMethodsContext_ = createRequiredContext<EditorReferenceMethods>('EditorReferenceMethodsContext')
/** @internal */
export const EditorReferenceMethodsContext = EditorReferenceMethodsContext_[0]
export const useEditorReferenceMethods = EditorReferenceMethodsContext_[1]

const EditorBlockElementContext_ = createRequiredContext<RenderElementProps>('EditorBlockElementContext')
/** @internal */
export const EditorBlockElementContext = EditorBlockElementContext_[0]
export const useEditorBlockElement = EditorBlockElementContext_[1]
