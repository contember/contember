import { createRequiredContext } from '@contember/react-utils'
import { EditorReferenceBlocks } from './blockEditor'

const EditorReferenceBlocksContext_ = createRequiredContext<EditorReferenceBlocks>('EditorReferenceBlocksContext')
/** @internal */
export const EditorReferenceBlocksContext = EditorReferenceBlocksContext_[0]
export const useEditorReferenceBlocks = EditorReferenceBlocksContext_[1]
