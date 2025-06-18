import { ComponentType } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { ReactElement } from 'react';
import { ReactNode } from 'react';

export declare type BuiltinElements<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = RichTextAnchorElement<CustomElements, CustomLeaves> | RichTextHeadingElement<CustomElements, CustomLeaves> | RichTextHorizontalRuleElement<CustomElements, CustomLeaves> | RichTextListItemElement<CustomElements, CustomLeaves> | RichTextOrderedListElement<CustomElements, CustomLeaves> | RichTextParagraphElement<CustomElements, CustomLeaves> | RichTextReferenceElement<CustomElements, CustomLeaves> | RichTextScrollTargetElement<CustomElements, CustomLeaves> | RichTextTableCellElement<CustomElements, CustomLeaves> | RichTextTableElement<CustomElements, CustomLeaves> | RichTextTableRowElement<CustomElements, CustomLeaves> | RichTextUnorderedListElement<CustomElements, CustomLeaves>;

export declare type BuiltinLeaves = RichTextBoldLeaf & RichTextCodeLeaf & RichTextHighlightLeaf & RichTextItalicLeaf & RichTextStrikeThroughLeaf & RichTextUnderlineLeaf;

export declare type ReferenceRenderer<Reference extends RichTextReference = RichTextReference, CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = ComponentType<ReferenceRendererProps<Reference, CustomElements, CustomLeaves>>;

export declare type ReferenceRendererMap<Reference extends RichTextReference = RichTextReference, CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = Record<string, ReferenceRenderer<Reference, CustomElements, CustomLeaves>>;

export declare type ReferenceRendererProps<Reference extends RichTextReference = RichTextReference, CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = {
    element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>;
    children: ReactElement;
    formatVersion: number;
    block: RichTextBlock<CustomElements, CustomLeaves>;
    options: RichTextRenderingOptions<CustomElements, CustomLeaves>;
} & RichTextReferenceFilledMetadata<CustomElements, CustomLeaves, Reference>;

export declare type RenderBlock = ComponentType<RenderBlockProps>;

export declare type RenderBlockProps = {
    block: unknown;
    children?: ReactNode;
};

export declare type RenderChildren<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = (children: RichTextChild<CustomElements, CustomLeaves> | readonly RichTextChild<CustomElements, CustomLeaves>[], 
/**
 * @deprecated No need to pass this anymore.
 */
options?: RichTextRenderingOptions<CustomElements, CustomLeaves>) => ReactElement;

export declare type RenderElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf, Reference extends RichTextReference = RichTextReference> = ComponentType<RenderElementProps<CustomElements, CustomLeaves, Reference>>;

export declare type RenderElementProps<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf, Reference extends RichTextReference = RichTextReference> = {
    formatVersion: number;
    block: RichTextBlock<CustomElements, CustomLeaves>;
    element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>;
    children: ReactElement;
    options: RichTextRenderingOptions<CustomElements, CustomLeaves>;
    fallback: ReactElement;
    renderChildren: RenderChildren<CustomElements, CustomLeaves>;
    /**
     * @deprecated To access the rendering options, use options. No need to pass it to renderChildren function.
     */
    renderChildrenOptions: RichTextRenderingOptions<CustomElements, CustomLeaves>;
} & RichTextReferenceMetadata<CustomElements, CustomLeaves, Reference>;

export declare type RenderLeaf<CustomLeaves extends RichTextLeaf> = ComponentType<RenderLeafProps<CustomLeaves>>;

export declare type RenderLeafProps<CustomLeaves extends RichTextLeaf = RichTextLeaf> = {
    formatVersion: number;
    leaf: CustomLeaves & BuiltinLeaves;
    fallback: ReactElement;
    children: string;
};

/**
 * Accepts normalized decoded RichText blocks and renders them using the provided renderers.
 * To use decoders, use `RichTextBlocksRenderer` or `RichTextFieldRenderer` instead.
 *
 * @group Content rendering
 */
export declare const RichText: <CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf>({ blocks, renderElement, renderLeaf, renderBlock, attributeNamePrefix, referenceRenderers, undefinedReferenceHandler, }: RichTextProps<CustomElements, CustomLeaves>) => JSX_2.Element;

export declare interface RichTextAnchorElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'anchor';
    href: string;
}

export declare interface RichTextBlock<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> {
    content: RootEditorNode<CustomElements, CustomLeaves>;
    references: Record<string, RichTextReference> | undefined;
    id: string | undefined;
}

export declare type RichTextBlockSource<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = {
    blocks: readonly Readonly<Record<string, unknown>>[];
    sourceField?: string;
    referencesField?: string;
    referenceDiscriminationField?: string;
    deserialize?: (source: string) => RootEditorNode<CustomElements, CustomLeaves>;
};

/**
 * Accepts raw RichText blocks and renders them using the provided renderers.
 *
 * @group Content rendering
 */
export declare const RichTextBlocksRenderer: <CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf>({ renderElement, renderLeaf, renderBlock, attributeNamePrefix, referenceRenderers, undefinedReferenceHandler, ...props }: RichTextBlocksRendererProps<CustomElements, CustomLeaves>) => JSX_2.Element;

export declare type RichTextBlocksRendererProps<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = RichTextBlockSource<CustomElements, CustomLeaves> & RichTextRenderingOptions<CustomElements, CustomLeaves>;

export declare interface RichTextBoldLeaf extends RichTextLeaf {
    isBold?: boolean;
}

export declare type RichTextChild<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = BuiltinElements<CustomElements, CustomLeaves> | CustomElements | (BuiltinLeaves & CustomLeaves);

export declare interface RichTextCodeLeaf extends RichTextLeaf {
    isCode?: boolean;
}

export declare interface RichTextElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> {
    type: string;
    children: readonly RichTextChild<CustomElements, CustomLeaves>[];
    referenceId?: string;
}

/**
 * Accepts raw RichText field source and renders them using the provided renderers.
 *
 * @group Content rendering
 */
export declare const RichTextFieldRenderer: <CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf>({ renderLeaf, renderBlock, renderElement, attributeNamePrefix, undefinedReferenceHandler, ...source }: RichTextFieldRendererProps<CustomElements, CustomLeaves>) => JSX_2.Element;

export declare type RichTextFieldRendererProps<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = RichTextFieldSource<CustomElements, CustomLeaves> & RichTextRenderingOptions<CustomElements, CustomLeaves>;

export declare interface RichTextFieldSource<CustomElements extends RichTextElement, CustomLeaves extends RichTextLeaf> {
    source: RootEditorNode<CustomElements, CustomLeaves> | string | null;
    deserialize?: (source: string) => RootEditorNode<CustomElements, CustomLeaves>;
}

export declare interface RichTextHeadingElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'heading';
    level: 1 | 2 | 3 | 4 | 5 | 6;
    isNumbered?: boolean;
}

export declare interface RichTextHighlightLeaf extends RichTextLeaf {
    isHighlighted?: boolean;
}

export declare interface RichTextHorizontalRuleElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'horizontalRule';
}

export declare interface RichTextItalicLeaf extends RichTextLeaf {
    isItalic?: boolean;
}

export declare interface RichTextLeaf {
    text: string;
}

export declare interface RichTextListItemElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'listItem';
}

export declare interface RichTextOrderedListElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'orderedList';
}

export declare interface RichTextParagraphElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'paragraph';
    isNumbered?: boolean;
}

export declare type RichTextProps<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = {
    blocks: RichTextBlock<CustomElements, CustomLeaves>[];
} & RichTextRenderingOptions<CustomElements, CustomLeaves>;

export declare type RichTextReference = {
    id: string;
    type: string;
} & Record<string, unknown>;

export declare interface RichTextReferenceElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'reference';
    referenceId: string;
}

export declare interface RichTextReferenceEmptyMetadata {
    reference: undefined;
    referenceType: undefined;
    referenceRenderer: undefined;
}

export declare interface RichTextReferenceFilledMetadata<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf, Reference extends RichTextReference = RichTextReference> {
    reference: Reference;
    referenceType: string;
    referenceRenderer?: ReferenceRenderer<Reference, CustomElements, CustomLeaves>;
}

export declare type RichTextReferenceMetadata<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf, Reference extends RichTextReference = RichTextReference> = RichTextReferenceFilledMetadata<CustomElements, CustomLeaves, Reference> | RichTextReferenceEmptyMetadata;

/**
 * @deprecated Use `RichTextBlocksRenderer` or `RichTextFieldRenderer` instead, or directly use `RichText`.
 * @group Content rendering
 */
export declare const RichTextRenderer: <CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf>(props: RichTextRendererProps<CustomElements, CustomLeaves>) => ReactElement;

export declare class RichTextRendererError extends Error {
}

export declare type RichTextRendererProps<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = RichTextFieldRendererProps<CustomElements, CustomLeaves> | RichTextBlocksRendererProps<CustomElements, CustomLeaves>;

export declare type RichTextRenderingOptions<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf, Reference extends RichTextReference = RichTextReference> = {
    renderElement?: RenderElement<CustomElements, CustomLeaves>;
    renderLeaf?: RenderLeaf<CustomLeaves>;
    renderBlock?: RenderBlock;
    referenceRenderers?: ReferenceRendererMap<any, CustomElements, CustomLeaves>;
    undefinedReferenceHandler?: UndefinedReferenceHandler<CustomElements, CustomLeaves, Reference>;
    attributeNamePrefix?: string;
};

export declare interface RichTextScrollTargetElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'scrollTarget';
    identifier: string;
}

export declare interface RichTextStrikeThroughLeaf extends RichTextLeaf {
    isStruckThrough?: boolean;
}

export declare interface RichTextTableCellElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'tableCell';
    headerScope?: 'row';
    justify?: 'start' | 'center' | 'end';
}

export declare interface RichTextTableElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'table';
}

export declare interface RichTextTableRowElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'tableRow';
    headerScope?: 'table';
}

export declare interface RichTextUnderlineLeaf extends RichTextLeaf {
    isUnderlined?: boolean;
}

export declare interface RichTextUnorderedListElement<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> extends RichTextElement<CustomElements, CustomLeaves> {
    type: 'unorderedList';
}

export declare interface RootEditorNode<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> {
    formatVersion: number;
    children: readonly RichTextChild<CustomElements, CustomLeaves>[];
}

export declare type UndefinedReferenceHandler<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf, Reference extends RichTextReference = RichTextReference> = (referenceId: string) => void | RichTextReferenceMetadata<CustomElements, CustomLeaves, Reference>;

export declare const useRichTextBlocksSource: <CustomElements extends RichTextElement, CustomLeaves extends RichTextLeaf>({ deserialize, blocks, referencesField, sourceField, referenceDiscriminationField, }: RichTextBlockSource<CustomElements, CustomLeaves>) => RichTextBlock<CustomElements, CustomLeaves>[];

export declare const useRichTextFieldSource: <CustomElements extends RichTextElement, CustomLeaves extends RichTextLeaf>({ source, deserialize, }: RichTextFieldSource<CustomElements, CustomLeaves>) => RichTextBlock<CustomElements, CustomLeaves>[];

export { }
