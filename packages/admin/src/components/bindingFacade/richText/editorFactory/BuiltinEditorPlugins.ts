type BuiltinTextBased = 'bold' | 'code' | 'italic' | 'highlight' | 'newline' | 'strikeThrough' | 'underline'
type BuiltinElementBased = 'anchor' | 'heading' | 'list' | 'horizontalRule' | 'paragraph' | 'scrollTarget' | 'table'
export type BuiltinEditorPlugins = BuiltinElementBased | BuiltinTextBased
