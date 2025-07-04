import { BlockEditorProps } from '@contember/react-slate-editor';
import { ComponentType } from 'react';
import { Editable } from 'slate-react';
import { Editor } from 'slate';
import { EditorPlugin } from '@contember/react-slate-editor-base';
import { EditorPlugin as EditorPlugin_2 } from '@contember/react-slate-editor';
import { ErrorAccessor } from '@contember/interface';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { MemoExoticComponent } from 'react';
import { NamedExoticComponent } from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { RenderElementProps } from 'slate-react';
import { RichTextFieldRendererProps } from '@contember/react-client';
import { SugaredRelativeEntityList } from '@contember/interface';
import { SugaredRelativeSingleField } from '@contember/interface';
import { TextareaHTMLAttributes } from 'react';

/**
 * baseEditorPlugins - Core plugin configuration for Slate.js editor components
 *
 * ### Plugin Structure
 * Contains renderer configurations and basic formatting capabilities for:
 *
 * #### Structural Elements
 * - **anchor**: Link handling with `AnchorRenderer`
 * - **paragraph**: Text blocks with `ParagraphRenderer`
 * - **heading**: Headings with `HeadingRenderer`
 * - **list**: List structures with:
 *   - `ListItemRenderer`
 *   - `OrderedListRenderer`
 *   - `UnorderedListRenderer`
 * - **horizontalRule**: Dividers with `HorizontalRuleRenderer`
 * - **scrollTarget**: Navigation anchors with `ScrollTargetRenderer`
 * - **table**: Tabular data with:
 *   - `TableElementRenderer`
 *   - `TableCellElementRenderer`
 *   - `TableRowElementRenderer`
 *
 * #### Text Formatting
 * - **bold**: Bold text formatting
 * - **code**: Inline code styling
 * - **highlight**: Text highlighting
 * - **italic**: Italic text
 * - **newline**: Manual line breaks
 * - **strikeThrough**: Strikethrough text
 * - **underline**: Underlined text
 *
 * ### Usage
 * ```tsx
 * // Create editor with base configuration
 * <RichTextEditor
 *   plugins={[
 *     baseEditorPlugins.paragraph,
 *     baseEditorPlugins.heading,
 *     baseEditorPlugins.bold,
 *     baseEditorPlugins.italic
 *   ]}
 * />
 * ```
 */
export declare const baseEditorPlugins: {
    anchor: <E extends Editor>(editor: E) => E;
    paragraph: <E extends Editor>(editor: E) => E;
    heading: <E extends Editor>(editor: E) => E;
    list: <E extends Editor>(editor: E) => E;
    horizontalRule: <E extends Editor>(editor: E) => E;
    scrollTarget: <E extends Editor>(editor: E) => E;
    table: <E extends Editor>(editor: E) => E;
    bold: EditorPlugin;
    code: EditorPlugin;
    highlight: EditorPlugin;
    italic: EditorPlugin;
    newline: EditorPlugin;
    strikeThrough: EditorPlugin;
    underline: EditorPlugin;
};

/**
 * BlockEditorField component - Rich text editor with drag-and-drop block management
 *
 * #### Purpose
 * Provides a structured content editing experience with sortable blocks and reference management
 *
 * #### Features
 * - Drag-and-drop block reordering
 * - Reference entity integration
 * - Slate.js editor core
 * - Plugin system extensibility
 * - Collision detection and measuring strategies
 *
 * #### Example: Basic usage
 * ```tsx
 * <BlockEditorField
 *   field="data"
 *   referencesField="references"
 *   referenceDiscriminationField="type"
 * >
 *   <EditorBlockToolbar>
 *     <EditorReferenceTrigger referenceType="image">
 *       <BlockButton><ImageIcon /> Image</BlockButton>
 *     </EditorReferenceTrigger>
 *   </EditorBlockToolbar>
 *
 *   <EditorBlock name="image" label="Image">
 *     <ImageField baseField="image" urlField="url" />
 *   </EditorBlock>
 * </BlockEditorField>
 * ```
 *
 * #### Example with custom plugins and toolbars (inline and block)
 * ```tsx
 * <BlockEditorField
 *   field="data"
 *   referencesField="references"
 *   referenceDiscriminationField="type"
 *   plugins={[
 *     editor => {
 *       editor.registerElement({
 *         type: 'link',
 *         isInline: true,
 *         render: LinkElement,
 *       })
 *     },
 *   ]}
 * >
 *   <EditorBlockToolbar>
 *     <EditorReferenceTrigger referenceType="image">
 *       <BlockButton>
 *         <ImageIcon /> Image
 *       </BlockButton>
 *     </EditorReferenceTrigger>
 *
 *     <EditorElementTrigger elementType={tableElementType}>
 *       <BlockButton>
 *         <TableIcon /> Table
 *       </BlockButton>
 *     </EditorElementTrigger>
 *
 *     <EditorElementTrigger elementType={scrollTargetElementType}>
 *       <BlockButton>
 *         <LocateIcon /> Scroll target
 *       </BlockButton>
 *     </EditorElementTrigger>
 *
 *     <EditorElementTrigger elementType={horizontalRuleElementType}>
 *       <BlockButton>
 *         <MinusIcon  /> Horizontal rule
 *       </BlockButton>
 *     </EditorElementTrigger>
 *   </EditorBlockToolbar>
 *
 *   <EditorInlineToolbar>
 *     <div>
 *       <EditorMarkTrigger mark={boldMark}>
 *           <Toggle><BoldIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorMarkTrigger mark={italicMark}>
 *         <Toggle><ItalicIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorMarkTrigger mark={underlineMark}>
 *         <Toggle><UnderlineIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorMarkTrigger mark={strikeThroughMark}>
 *         <Toggle><StrikethroughIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorMarkTrigger mark={highlightMark}>
 *         <Toggle><HighlighterIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorMarkTrigger mark={codeMark}>
 *         <Toggle><CodeIcon className="h-3 w-3" /></Toggle>
 *       </EditorMarkTrigger>
 *
 *       <EditorElementTrigger elementType={anchorElementType}>
 *         <Toggle><Link2Icon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <Popover>
 *         <PopoverTrigger asChild>
 *           <Toggle><LinkIcon className="h-3 w-3" /></Toggle>
 *         </PopoverTrigger>
 *         <PopoverContent>
 *           <EditorInlineReferencePortal referenceType="link">
 *             <LinkField field="link" />
 *             <ConfirmReferenceButton />
 *           </EditorInlineReferencePortal>
 *         </PopoverContent>
 *       </Popover>
 *     </div>
 *
 *     <div>
 *       <EditorElementTrigger elementType={paragraphElementType} suchThat={{ isNumbered: false }}>
 *         <Toggle><PilcrowIcon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorElementTrigger elementType={headingElementType} suchThat={{ level: 1, isNumbered: false }}>
 *         <Toggle><Heading1Icon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorElementTrigger elementType={headingElementType} suchThat={{ level: 2, isNumbered: false }}>
 *         <Toggle><Heading2Icon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorElementTrigger elementType={headingElementType} suchThat={{ level: 3, isNumbered: false }}>
 *         <Toggle><Heading3Icon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorElementTrigger elementType={unorderedListElementType}>
 *           <Toggle><ListIcon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorElementTrigger elementType={orderedListElementType}>
 *         <Toggle><ListOrderedIcon className="h-3 w-3" /></Toggle>
 *       </EditorElementTrigger>
 *
 *       <EditorGenericTrigger {...createAlignHandler('start')}>
 *         <Toggle className="ml-4"><AlignLeftIcon className="h-3 w-3" /></Toggle>
 *       </EditorGenericTrigger>
 *
 *       <EditorGenericTrigger {...createAlignHandler('end')}>
 *         <Toggle><AlignRightIcon className="h-3 w-3" /></Toggle>
 *       </EditorGenericTrigger>
 *
 *       <EditorGenericTrigger {...createAlignHandler('center')}>
 *         <Toggle><AlignCenterIcon className="h-3 w-3" /></Toggle>
 *       </EditorGenericTrigger>
 *
 *       <EditorGenericTrigger {...createAlignHandler('justify')}>
 *         <Toggle><AlignJustifyIcon className="h-3 w-3" /></Toggle>
 *       </EditorGenericTrigger>
 *     </div>
 *   </EditorInlineToolbar>
 *
 *   <EditorBlock name="quote" label="Quote">
 *     <EditorBlockContent />
 *   </EditorBlock>
 *
 *   <EditorBlock name="image" label="Image">
 *     <ImageField baseField="image" urlField="url" />
 *   </EditorBlock>
 * </BlockEditorField>
 * ```
 *
 */
export declare const BlockEditorField: NamedExoticComponent<BlockEditorFieldProps>;

export declare type BlockEditorFieldProps = BlockEditorProps & {
    /** Field for storing related entities */
    referencesField: SugaredRelativeEntityList['field'];
    /** Field for entity type discrimination */
    referenceDiscriminationField: SugaredRelativeSingleField['field'];
    /** Editor placeholder text */
    placeholder?: string;
};

export declare const BlockEditorInner: ({ children, placeholder }: {
    placeholder?: string;
    children: ReactNode;
}) => JSX_2.Element;

/**
 * blockEditorPlugins - Advanced content editing plugins with structural elements
 *
 * #### Purpose
 * Enables complex document structures and block management in Slate editor
 *
 * #### Additional Features beyond richTextFieldPlugins:
 * - Paragraph/heading formatting
 * - Lists (ordered/unordered)
 * - Horizontal rules
 * - Tables
 * - Scroll targets
 * - Drag-and-drop block sorting
 *
 * #### Key Integration
 * - `withSortable` enables block reordering
 * - Requires `SortableBlock` component for drag handles
 *
 * #### Example Usage
 * ```tsx
 * <BlockEditor plugins={blockEditorPlugins}>
 *   <SortableBlock name="section" />
 * </BlockEditor>
 * ```
 */
export declare const blockEditorPlugins: EditorPlugin_2[];

export declare const BlockElement: NamedExoticComponent<BlockElementProps>;

export declare interface BlockElementProps extends RenderElementProps {
    domElement?: keyof JSX.IntrinsicElements;
    withBoundaries?: boolean;
    className?: string;
}

declare type EditableProps = typeof Editable extends (p: infer P) => any ? P : never;

/**
 * EditorBlock component - Configurable content block for rich text editor
 *
 * #### Purpose
 * Creates reusable, customizable content blocks within a Slate.js editor instance
 *
 * #### Features
 * - Drag-and-drop enabled block structure
 * - Alternate configuration UI via popover
 * - Block type labeling and identification
 *
 * #### Example: Basic usage
 * ```tsx
 * <BlockEditorField
 *   field="data"
 *   referencesField="references"
 *   referenceDiscriminationField="type"
 * >
 *   <EditorBlockToolbar>
 *     <EditorReferenceTrigger referenceType="image">
 *       <BlockButton><ImageIcon /> Image</BlockButton>
 *     </EditorReferenceTrigger>
 *   </EditorBlockToolbar>
 *
 *   <EditorBlock name="image" label="Image">
 *     <ImageField baseField="image" urlField="url" />
 *   </EditorBlock>
 * </BlockEditorField>
 * ```
 */
export declare const EditorBlock: NamedExoticComponent<EditorBlockProps>;

/**
 * EditorBlockContent component - Editable content area for blocks
 *
 * #### Purpose
 * Provides the main editable region within a content block
 *
 * #### Features
 * - Automatic placeholder text when empty
 * - ContentEditable management
 * - Text presence detection
 * - Proper padding and positioning
 *
 * #### Example
 * ```tsx
 * <EditorBlockContent />
 * ```
 */
export declare const EditorBlockContent: NamedExoticComponent<    {}>;

export declare interface EditorBlockProps {
    /** Unique block type identifier */
    name: string;
    /** Display name for block type */
    label: ReactNode;
    /** Primary block content */
    children: ReactNode;
    /** Alternate configuration UI (optional) */
    alternate?: ReactNode;
}

export declare const EditorBlockToolbar: MemoExoticComponent<({ children }: EditorBlockToolbarProps) => JSX_2.Element>;

export declare interface EditorBlockToolbarProps {
    children: ReactNode;
}

export declare const EditorCanvas: {
    <P extends HTMLTextAreaDivTargetProps>(props: EditorCanvasProps<P>): ReactElement;
    displayName?: string;
};

export declare interface EditorCanvasProps<P extends HTMLTextAreaDivTargetProps> {
    underlyingComponent: ComponentType<P>;
    componentProps: P;
    focusRing?: boolean;
    children?: ReactNode;
}

export declare const EditorEditableCanvas: (editableProps: EditorEditableCanvasProps) => JSX_2.Element;

export declare interface EditorEditableCanvasProps extends EditableProps {
}

export declare const EditorInlineToolbar: MemoExoticComponent<({ children }: EditorInlineToolbarProps) => JSX_2.Element>;

export declare interface EditorInlineToolbarProps {
    children: ReactNode;
}

/**
 * Props for the {@link FormContainer} component.
 */
declare interface FormContainerProps {
    /**
     * The label for the form element.
     */
    label?: ReactNode;
    /**
     * The description text for the form element.
     */
    description?: ReactNode;
    /**
     * The child components or form elements to render within the container.
     */
    children: ReactNode;
    /**
     * The error message to display.
     */
    errors?: ErrorAccessor.Error[] | ReactNode;
    /**
     * Indicates whether the form element
     */
    required?: boolean;
}

export declare interface HTMLTextAreaDivTargetProps extends TextareaHTMLAttributes<HTMLDivElement> {
}

/**
 * RichTextField component - Form-integrated rich text editor with basic formatting
 *
 * #### Purpose
 * Provides a rich text editing experience within Contember forms with common formatting tools
 *
 * #### Features
 * - Integrated with Contember form field management
 * - Basic text formatting (bold, italic, code, etc.)
 * - Read-only state during mutations
 * - Custom placeholder support
 * - Plugin-based architecture
 *
 * #### Example: Basic usage
 * ```tsx
 * <RichTextField field="content" />
 * ```
 *
 * #### Example: With custom placeholder
 * ```tsx
 * <RichTextField
 *   field="content"
 *   label="Article body"
 *   placeholder="Enter your text here"
 * />
 * ```
 */
export declare const RichTextField: NamedExoticComponent<RichTextFieldProps>;

/**
 * richTextFieldPlugins - Basic text formatting plugins for Slate editor
 *
 * #### Purpose
 * Provides essential inline formatting tools for rich text fields
 *
 * #### Included Features:
 * - Anchor/links
 * - Bold/italic/underline
 * - Code blocks
 * - Text highlighting
 * - Strikethrough
 * - Manual newlines
 *
 * #### Example Usage
 * ```tsx
 * <RichTextEditor plugins={richTextFieldPlugins} />
 * ```
 */
export declare const richTextFieldPlugins: EditorPlugin_2[];

export declare type RichTextFieldProps = {
    /** Form field name for storing content */
    field: SugaredRelativeSingleField['field'];
    children: ReactNode;
} & Omit<FormContainerProps, 'children'>;

export declare type RichTextRendererProps = {
    /** Field containing rich text content */
    field: SugaredRelativeSingleField['field'];
} & Omit<RichTextFieldRendererProps, 'source'>;

/**
 * RichTextView component - Displays formatted rich text content from a Contember field
 *
 * #### Purpose
 * Renders stored rich text content with proper formatting and structure
 *
 * #### Features
 * - Safe JSON parsing of stored rich text data
 * - Conditional rendering when content is empty
 * - Integration with Contember's rich text rendering system
 * - Customizable through RichTextFieldRenderer props
 *
 * #### Example
 * ```tsx
 * <RichTextView field="content" />
 * ```
 *
 * #### Example with renderers
 * ```tsx
 * const renderLeaf = (leaf: Leaf) => {
 * 	let content = <>{leaf.text}</>
 *
 *  if (leaf.isBold) {
 *    content = <strong>{content}</strong>
 * 	}
 *
 * 	if (leaf.isItalic) {
 *    content = <em>{content}</em>
 * 	}
 *
 * 	if (leaf.isUnderlined) {
 *    content = <u>{content}</u>
 * 	}
 *
 * 	return content
 * }
 *
 * const renderElement = (element: RichTextElement, leafRenderer: LeafRenderer) => {
 *   if (isLeaf(element)) {
 *     return leafRenderer(element)
 *   }
 *
 *   if (element.type === 'anchor') {
 *     const children = element.children.map((child, index) => (
 *       <Fragment key={index}>
 *         {isLeaf(child) && leafRenderer(child)}
 *       </Fragment>
 *     ))
 *
 *     return (
 *       <a href={element.href}>
 *         {children}
 *       </a>
 *     )
 *   }
 *
 *   return null
 * }
 *
 * <RichTextView
 *   field="content"
 *   renderLeaf={renderLeaf}
 *   renderElement={renderElement}
 *   referenceRenderers={{
 *      image: ({ reference }) => <img src={reference.url} />
 *   }}
 * />
 * ```
 */
export declare const RichTextView: NamedExoticComponent<RichTextRendererProps>;

export { }
