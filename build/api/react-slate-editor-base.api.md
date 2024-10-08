## API Report File for "@contember/react-slate-editor-base"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { Ancestor } from 'slate';
import { BaseEditor } from 'slate';
import { Descendant } from 'slate';
import { Editor as Editor_2 } from 'slate';
import { EditorInterface } from 'slate';
import { Transforms as EditorTransforms } from 'slate';
import { Element as Element_2 } from 'slate';
import { EntityAccessor } from '@contember/react-binding';
import { Environment } from '@contember/react-binding';
import { FieldBasicProps } from '@contember/react-binding';
import type { FocusEvent as FocusEvent_2 } from 'react';
import { FunctionComponent } from 'react';
import { HistoryEditor } from 'slate-history';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import type { KeyboardEvent as KeyboardEvent_2 } from 'react';
import { Location as Location_2 } from 'slate';
import { MouseEventHandler } from 'react';
import { Node as Node_2 } from 'slate';
import { NodeEntry } from 'slate';
import { Path } from 'slate';
import { Point } from 'slate';
import { Range as Range_2 } from 'slate';
import { ReactEditor } from 'slate-react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { RenderElementProps } from 'slate-react';
import { RenderLeafProps } from 'slate-react';
import type { Scalar } from '@contember/react-binding';
import { Selection as Selection_2 } from 'slate';
import type * as Slate from 'slate';
import { Text as Text_2 } from 'slate';

// @public (undocumented)
export type AlignDirection = 'start' | 'center' | 'end' | 'justify' | undefined;

// @public (undocumented)
export interface AnchorElement extends Element_2 {
    // (undocumented)
    children: Editor_2['children'];
    // (undocumented)
    href: string;
    // (undocumented)
    type: typeof anchorElementType;
}

// @public (undocumented)
export const anchorElementPlugin: ({ render }: {
    render: ElementRenderer<AnchorElement>;
}) => EditorElementPlugin<AnchorElement>;

// @public (undocumented)
export const anchorElementType: "anchor";

// @public (undocumented)
export const anchorHtmlDeserializer: HtmlDeserializerPlugin;

// @public (undocumented)
export const boldMark = "isBold";

// @public (undocumented)
export const boldMarkPlugin: EditorMarkPlugin;

// @public (undocumented)
export const codeMark = "isCode";

// @public (undocumented)
export const codeMarkPlugin: EditorMarkPlugin;

// @public (undocumented)
export const ContemberEditor: {
    addMarks: <T extends Text_2, E extends Editor_2>(editor: E, marks: TextSpecifics<T>) => void;
    canToggleMark: <T extends Text_2, E extends Editor_2>(editor: E, markName: string, markValue?: unknown) => boolean;
    closest: <E extends Editor_2>(editor: E, options: {
        at?: Location_2;
        match: (node: Editor_2 | Element_2) => boolean;
    }) => NodeEntry<Editor_2 | Element_2> | undefined;
    closestBlockEntry: <E extends Editor_2>(editor: E, options?: {
        at?: Location_2;
        match?: (node: Element_2) => boolean;
    }) => NodeEntry<Editor | EditorElement> | undefined;
    closestViableBlockContainerEntry: <E extends Editor_2>(editor: E, options?: {
        at?: Location_2;
    }) => NodeEntry<Element_2 | Editor_2> | undefined;
    ejectElement: <E extends Editor_2>(editor: E, path: Path) => void;
    elementToSpecifics: <Element extends Element_2 = EditorElement>(element: Element) => Partial<Element>;
    getElementDataAttributes: <Element extends Element_2 = EditorElement>(element: Element, attributeNamePrefix?: string) => ElementDataAttributes;
    getPreviousSibling: <E extends Editor_2 = Editor, CurrentNode extends Node_2 = Node_2, PreviousNode extends Node_2 = CurrentNode>(editor: E, node: CurrentNode, nodePath: Path) => NodeEntry<PreviousNode> | undefined;
    hasMarks: <T extends Text_2, E extends Editor_2>(editor: E, marks: TextSpecifics<T>, options?: {
        from?: Path;
        to?: Path;
    }) => boolean;
    hasParentOfType: <Editor extends Editor_2, Element extends Element_2>(editor: Editor, nodeEntry: NodeEntry<Node_2 | Element_2>, type: Element["type"], suchThat?: Partial<Element>) => boolean;
    isElementType: <Element extends Element_2>(element: Node_2, type: Element["type"], suchThat?: Partial<Element>) => boolean;
    permissivelyDeserializeNodes: <E extends Editor_2>(editor: E, serializedElement: string, errorMessage?: string) => Array<Element_2 | Text_2>;
    removeMarks: <T extends Text_2, E extends Editor_2>(editor: E, marks: TextSpecifics<T>) => void;
    serializeNodes: <E extends Editor_2>(editor: E, elements: Array<Element_2 | Text_2>, errorMessage?: string) => string;
    strictlyDeserializeNodes: <E extends Editor_2>(editor: E, serializedElement: string, errorMessage?: string) => Array<Element_2 | Text_2>;
    textToSpecifics: <Text extends Text_2 = EditorText>(textNode: Text) => TextSpecifics<Text>;
    toLatestFormat: <E extends Editor_2>(editor: E, potentiallyOldNode: SerializableEditorNode) => SerializableEditorNode;
    topLevelNodes: <E extends Editor_2>(editor: E) => Generator<NodeEntry<Node_2>, void, undefined>;
};

// @public (undocumented)
export const createAlignHandler: (direction: AlignDirection) => {
    isActive?: (args: {
        editor: Editor_2;
    }) => boolean;
    shouldDisplay?: (args: {
        editor: Editor_2;
    }) => boolean;
    toggle: (args: {
        editor: Editor_2;
    }) => void;
};

// @public (undocumented)
export const createEditor: ({ plugins, defaultElementType, entity, environment, children, }: CreateEditorOptions) => {
    editor: Editor_2;
    OuterWrapper: FunctionComponent<{
        children: ReactNode;
    }>;
    InnerWrapper: FunctionComponent<{
        children: ReactNode;
    }>;
};

// @public (undocumented)
export interface CreateEditorOptions extends CreateEditorPublicOptions {
    // (undocumented)
    children: ReactNode;
    // (undocumented)
    defaultElementType: string;
    // (undocumented)
    entity: EntityAccessor;
    // (undocumented)
    environment: Environment;
}

// @public (undocumented)
export interface CreateEditorPublicOptions {
    // (undocumented)
    plugins?: EditorPlugin[];
}

// @public (undocumented)
export const createEmptyTableCellElement: () => {
    type: "tableCell";
    children: {
        text: string;
    }[];
};

// @public (undocumented)
export const createEmptyTableElement: (rowCount?: number, columnCount?: number) => {
    type: "table";
    children: {
        type: "tableRow";
        children: {
            type: "tableCell";
            children: {
                text: string;
            }[];
        }[];
    }[];
};

// @public (undocumented)
export const createEmptyTableRowElement: (columnCount?: number) => {
    type: "tableRow";
    children: {
        type: "tableCell";
        children: {
            text: string;
        }[];
    }[];
};

// @public (undocumented)
export const createMarkHtmlDeserializer: (markType: string, tagMatcher: (el: HTMLElement) => boolean, attributeMatcher: (el: HTMLElement) => boolean) => HtmlDeserializerPlugin;

// @public (undocumented)
export type Editor = EditorWithEssentials<ReactEditor & HistoryEditor & BaseEditor>;

// @public (undocumented)
export type EditorAncestor = Ancestor;

// @public (undocumented)
export type EditorDefaultElementFactory = (children: Descendant[]) => Element_2;

// @public (undocumented)
export type EditorDescendant = Descendant;

// @public (undocumented)
export type EditorElement = {
    [K in string]: unknown;
} & {
    type: string;
    children: Array<Descendant>;
};

// @public (undocumented)
export interface EditorElementPlugin<T extends Element_2> {
    // (undocumented)
    acceptsAttributes?: (args: {
        editor: Editor_2;
        suchThat: Partial<T>;
    }) => boolean;
    // (undocumented)
    canContainAnyBlocks?: boolean;
    // (undocumented)
    isActive?: (args: {
        editor: Editor_2;
        suchThat?: Partial<T>;
    }) => boolean;
    // (undocumented)
    isInline?: boolean;
    // (undocumented)
    isVoid?: boolean | ((args: {
        element: T;
        editor: Editor_2;
    }) => boolean);
    // (undocumented)
    normalizeNode?: (args: {
        element: T;
        path: Path;
        editor: Editor_2;
        preventDefault: () => void;
    }) => void;
    // (undocumented)
    render: ElementRenderer<T>;
    // (undocumented)
    toggleElement?: (args: {
        editor: Editor_2;
        suchThat?: Partial<T>;
    }) => void;
    // (undocumented)
    type: T['type'];
}

// @public (undocumented)
export const EditorElementTrigger: ({ elementType, suchThat, ...props }: EditorElementTriggerProps) => JSX_2.Element;

// @public (undocumented)
export interface EditorElementTriggerProps {
    // (undocumented)
    children: ReactElement;
    // (undocumented)
    elementType: string;
    // (undocumented)
    suchThat?: Record<string, unknown>;
}

// @public (undocumented)
export const EditorGenericTrigger: ({ toggle, isActive, shouldDisplay, ...props }: EditorGenericTriggerProps) => JSX_2.Element | null;

// @public (undocumented)
export interface EditorGenericTriggerProps {
    // (undocumented)
    children: ReactElement;
    // (undocumented)
    isActive?: (args: {
        editor: Editor_2;
    }) => boolean;
    // (undocumented)
    shouldDisplay?: (args: {
        editor: Editor_2;
    }) => boolean;
    // (undocumented)
    toggle: (args: {
        editor: Editor_2;
    }) => void;
}

// @public (undocumented)
export interface EditorMarkPlugin {
    // (undocumented)
    isHotKey: (e: KeyboardEvent) => boolean;
    // (undocumented)
    render: FunctionComponent<RenderLeafProps>;
    // (undocumented)
    type: string;
}

// @public (undocumented)
export const EditorMarkTrigger: ({ mark, ...props }: EditorMarkTriggerProps) => JSX_2.Element;

// @public (undocumented)
export interface EditorMarkTriggerProps {
    // (undocumented)
    children: ReactElement;
    // (undocumented)
    mark: string;
}

// @public (undocumented)
export type EditorPath = Path;

// @public (undocumented)
export type EditorPlugin = ((editor: Editor_2) => void) | {
    extendEditor?: (args: {
        editor: Editor_2;
        children: ReactNode;
        environment: Environment;
        entity: EntityAccessor;
    }) => void;
    OuterWrapper?: FunctionComponent<EditorPluginWrapperProps>;
    InnerWrapper?: FunctionComponent<EditorPluginWrapperProps>;
    staticRender?: (props: {
        children?: ReactNode;
    }, environment: Environment) => ReactNode;
};

// @public (undocumented)
export type EditorPluginWrapperProps = {
    children?: ReactNode;
    editor: Editor_2;
};

// @public (undocumented)
export type EditorPoint = Point;

// @public (undocumented)
export type EditorRange = Range_2;

// @public (undocumented)
export type EditorRenderElementProps = RenderElementProps;

// @public (undocumented)
export type EditorSelection = Selection_2;

// @public (undocumented)
export type EditorText = {
    [K in string]: unknown;
} & {
    text: string;
};

export { EditorTransforms }

// @public (undocumented)
export const EditorUtils: EditorInterface;

// @public (undocumented)
export type EditorWithEssentials<E extends BaseEditor> = WithEssentials & E;

// @public (undocumented)
export const EditorWrapNodeTrigger: ({ elementType, suchThat, selection, ...props }: EditorWrapNodeTriggerProps) => JSX_2.Element;

// @public (undocumented)
export interface EditorWrapNodeTriggerProps {
    // (undocumented)
    children: ReactElement;
    // (undocumented)
    elementType: string;
    // (undocumented)
    onClick?: MouseEventHandler<HTMLElement>;
    // (undocumented)
    selection?: Selection_2;
    // (undocumented)
    suchThat?: Record<string, unknown>;
}

// @public (undocumented)
export const ejectHeadingElement: (editor: Editor_2, elementPath: Path) => void;

// @public (undocumented)
export interface ElementDataAttributes {
    // (undocumented)
    [dataAttribute: string]: Scalar;
}

// @public (undocumented)
export type ElementRenderer<T extends Element_2> = FunctionComponent<RenderElementProps & {
    element: T;
}>;

// @public (undocumented)
export const getTableElementColumnCount: (element: TableElement) => number;

// @public (undocumented)
export const getTableElementRowCount: (element: TableElement) => number;

// @public (undocumented)
export interface HeadingElement extends Element_2 {
    // (undocumented)
    align?: AlignDirection;
    // (undocumented)
    children: Editor_2['children'];
    // (undocumented)
    isNumbered?: boolean;
    // (undocumented)
    level: 1 | 2 | 3 | 4 | 5 | 6;
    // (undocumented)
    type: typeof headingElementType;
}

// @public (undocumented)
export const headingElementPlugin: ({ render }: {
    render: ElementRenderer<HeadingElement>;
}) => EditorElementPlugin<HeadingElement>;

// @public (undocumented)
export const headingElementType: "heading";

// @public (undocumented)
export const headingHtmlDeserializer: HtmlDeserializerPlugin;

// @public (undocumented)
export const highlightMark = "isHighlighted";

// @public (undocumented)
export const highlightMarkPlugin: EditorMarkPlugin;

// @public (undocumented)
export interface HorizontalRuleElement extends Element_2 {
    // (undocumented)
    children: Editor_2['children'];
    // (undocumented)
    type: typeof horizontalRuleElementType;
}

// @public (undocumented)
export const horizontalRuleElementPlugin: ({ render }: {
    render: ElementRenderer<HorizontalRuleElement>;
}) => EditorElementPlugin<HorizontalRuleElement>;

// @public (undocumented)
export const horizontalRuleElementType: "horizontalRule";

// @public (undocumented)
export type HtmlDeserializerNextCallback = (children: NodeList | Node[], cumulativeTextAttrs: HtmlDeserializerTextAttrs) => Descendant[];

// @public (undocumented)
export type HtmlDeserializerNodesWithType = {
    texts: Descendant[];
    elements?: undefined;
} | {
    elements: Element_2[];
    texts?: undefined;
} | null;

// @public (undocumented)
export interface HtmlDeserializerPlugin {
    // (undocumented)
    processAttributesPaste?: (args: {
        deserializer: HtmlDeserializer;
        element: HTMLElement;
        cumulativeTextAttrs: HtmlDeserializerTextAttrs;
    }) => HtmlDeserializerTextAttrs;
    // (undocumented)
    processBlockPaste?: (args: {
        deserializer: HtmlDeserializer;
        element: HTMLElement;
        next: HtmlDeserializerNextCallback;
        cumulativeTextAttrs: HtmlDeserializerTextAttrs;
    }) => Element_2[] | Element_2 | null;
    // (undocumented)
    processInlinePaste?: (args: {
        deserializer: HtmlDeserializer;
        element: HTMLElement;
        next: HtmlDeserializerNextCallback;
        cumulativeTextAttrs: HtmlDeserializerTextAttrs;
    }) => Descendant[] | Descendant | null;
    // (undocumented)
    processNodeListPaste?: (args: {
        deserializer: HtmlDeserializer;
        nodeList: Node[];
        cumulativeTextAttrs: HtmlDeserializerTextAttrs;
    }) => HtmlDeserializerNodesWithType;
}

// @public (undocumented)
export interface HtmlDeserializerTextAttrs {
    // (undocumented)
    [key: string]: any;
}

// @public (undocumented)
export const isAnchorElement: (element: Node_2) => element is AnchorElement;

// @public (undocumented)
export const isAnchorElementActive: (editor: Editor_2) => boolean;

// @public (undocumented)
export const isHeadingElement: (element: Node_2, suchThat?: Partial<HeadingElement>) => element is HeadingElement;

// @public (undocumented)
export const isHorizontalRuleElement: (element: Node_2) => element is HorizontalRuleElement;

// @public (undocumented)
export const isHorizontalRuleElementActive: (editor: Editor_2) => boolean;

// @public (undocumented)
export const isListItemElement: (element: Node_2, suchThat?: Partial<ListItemElement>) => element is ListItemElement;

// @public (undocumented)
export const isOrderedListElement: (element: Node_2, suchThat?: Partial<OrderedListElement>) => element is OrderedListElement;

// @public (undocumented)
export const isParagraphElement: (element: Node_2, suchThat?: Partial<ParagraphElement>) => element is ParagraphElement;

// @public (undocumented)
export const isScrollTargetElement: (element: Node_2) => element is ScrollTargetElement;

// @public (undocumented)
export const isScrollTargetElementActive: (editor: Editor_2) => boolean;

// @public (undocumented)
export const isTableCellElement: (element: Node_2) => element is TableCellElement;

// @public (undocumented)
export const isTableElement: (element: Node_2) => element is TableElement;

// @public (undocumented)
export const isTableRowElement: (element: Node_2) => element is TableRowElement;

// @public (undocumented)
export const isUnorderedListElement: (element: Node_2, suchThat?: Partial<UnorderedListElement>) => element is UnorderedListElement;

// @public (undocumented)
export const italicMark = "isItalic";

// @public (undocumented)
export const italicMarkPlugin: EditorMarkPlugin;

// @public (undocumented)
export interface ListElementProperties {
    // (undocumented)
    ordered: boolean;
    // (undocumented)
    properties: Record<string, unknown>;
}

// @public (undocumented)
export const listHtmlDeserializerFactory: ({ getListElementProperties }?: ListHtmlDeserializerOptions) => HtmlDeserializerPlugin;

// @public (undocumented)
export interface ListHtmlDeserializerOptions {
    // (undocumented)
    getListElementProperties?: (text: string) => ListElementProperties;
}

// @public (undocumented)
export interface ListItemElement extends Element_2 {
    // (undocumented)
    children: Editor_2['children'];
    // (undocumented)
    type: typeof listItemElementType;
}

// @public (undocumented)
export const listItemElementPlugin: ({ render }: {
    render: ElementRenderer<ListItemElement>;
}) => EditorElementPlugin<ListItemElement>;

// @public (undocumented)
export const listItemElementType: "listItem";

// @public (undocumented)
export interface OrderedListElement extends Element_2 {
    // (undocumented)
    children: Editor_2['children'];
    // (undocumented)
    type: typeof orderedListElementType;
}

// @public (undocumented)
export const orderedListElementPlugin: ({ render }: {
    render: ElementRenderer<OrderedListElement>;
}) => EditorElementPlugin<OrderedListElement>;

// @public (undocumented)
export const orderedListElementType: "orderedList";

// @public (undocumented)
export interface ParagraphElement extends Element_2 {
    // (undocumented)
    align?: AlignDirection;
    // (undocumented)
    children: Editor_2['children'];
    // (undocumented)
    isNumbered?: boolean;
    // (undocumented)
    type: typeof paragraphElementType;
}

// @public (undocumented)
export const paragraphElementPlugin: ({ render }: {
    render: ElementRenderer<ParagraphElement>;
}) => EditorElementPlugin<ParagraphElement>;

// @public (undocumented)
export const paragraphElementType: "paragraph";

// @public (undocumented)
export const paragraphHtmlDeserializer: HtmlDeserializerPlugin;

// @public
export const RichTextEditor: FunctionComponent<RichTextEditorProps>;

// @public (undocumented)
export type RichTextEditorProps = FieldBasicProps & CreateEditorPublicOptions & {
    children: React.ReactNode;
};

// @public (undocumented)
export interface ScrollTargetElement extends Element_2 {
    // (undocumented)
    children: Editor_2['children'];
    // (undocumented)
    identifier: string;
    // (undocumented)
    type: typeof scrollTargetElementType;
}

// @public (undocumented)
export const scrollTargetElementPlugin: ({ render }: {
    render: ElementRenderer<ScrollTargetElement>;
}) => EditorElementPlugin<ScrollTargetElement>;

// @public (undocumented)
export const scrollTargetElementType: "scrollTarget";

// @public (undocumented)
export interface SerializableEditorNode {
    // (undocumented)
    children: Array<Element_2 | Text_2>;
    // (undocumented)
    formatVersion: number;
}

// @public (undocumented)
export const strikeThroughMark = "isStruckThrough";

// @public (undocumented)
export const strikeThroughPlugin: EditorMarkPlugin;

// @public (undocumented)
export interface TableCellElement extends Element_2 {
    // (undocumented)
    children: Editor_2['children'];
    // (undocumented)
    headerScope?: 'row';
    // (undocumented)
    justify?: 'start' | 'center' | 'end';
    // (undocumented)
    type: typeof tableCellElementType;
}

// @public (undocumented)
export const tableCellElementPlugin: ({ render }: {
    render: ElementRenderer<TableCellElement>;
}) => EditorElementPlugin<TableCellElement>;

// @public (undocumented)
export const tableCellElementType: "tableCell";

// @public (undocumented)
export interface TableElement extends Element_2 {
    // (undocumented)
    children: Editor_2['children'];
    // (undocumented)
    type: typeof tableElementType;
}

// @public (undocumented)
export const tableElementPlugin: ({ render }: {
    render: ElementRenderer<TableElement>;
}) => EditorElementPlugin<TableElement>;

// @public (undocumented)
export const tableElementType: "table";

// @public (undocumented)
export class TableModifications {
    // (undocumented)
    static addTableColumn(editor: Editor_2, element: TableElement, index?: number): void;
    // (undocumented)
    static addTableRow(editor: Editor_2, element: TableElement, index?: number): void;
    // (undocumented)
    static deleteTableColumn(editor: Editor_2, element: TableElement, index: number): void;
    // (undocumented)
    static deleteTableRow(editor: Editor_2, element: TableElement, index: number): void;
    // (undocumented)
    static justifyTableColumn(editor: Editor_2, element: TableElement, columnIndex: number, direction: TableCellElement['justify']): void;
    // (undocumented)
    static toggleTableColumnHeaderScope(editor: Editor_2, element: TableElement, columnIndex: number, scope: TableCellElement['headerScope']): void;
    // (undocumented)
    static toggleTableRowHeaderScope(editor: Editor_2, element: TableElement, rowIndex: number, scope: TableRowElement['headerScope']): void;
}

// @public (undocumented)
export interface TableRowElement extends Element_2 {
    // (undocumented)
    children: Editor_2['children'];
    // (undocumented)
    headerScope?: 'table';
    // (undocumented)
    type: typeof tableRowElementType;
}

// @public (undocumented)
export const tableRowElementPlugin: ({ render }: {
    render: ElementRenderer<TableRowElement>;
}) => EditorElementPlugin<TableRowElement>;

// @public (undocumented)
export const tableRowElementType: "tableRow";

// @public (undocumented)
export type TextSpecifics<Text extends Text_2> = Omit<Text, 'text'>;

// @public (undocumented)
export const underlineMark = "isUnderlined";

// @public (undocumented)
export const underlineMarkPlugin: EditorMarkPlugin;

// @public (undocumented)
export interface UnorderedListElement extends Element_2 {
    // (undocumented)
    children: Editor_2['children'];
    // (undocumented)
    type: typeof unorderedListElementType;
}

// @public (undocumented)
export const unorderedListElementPlugin: ({ render }: {
    render: ElementRenderer<UnorderedListElement>;
}) => EditorElementPlugin<UnorderedListElement>;

// @public (undocumented)
export const unorderedListElementType: "unorderedList";

// @public (undocumented)
export const withAnchors: ({ render }: {
    render: ElementRenderer<AnchorElement>;
}) => <E extends Editor_2>(editor: E) => E;

// @public (undocumented)
export const withBold: () => EditorPlugin;

// @public (undocumented)
export const withCode: () => EditorPlugin;

// @public (undocumented)
export interface WithEssentials {
    // (undocumented)
    acceptsAttributes: <E extends Element_2>(elementType: E['type'], suchThat: Partial<E>) => boolean;
    // (undocumented)
    canContainAnyBlocks: (element: Element_2 | Editor_2) => boolean;
    // (undocumented)
    canToggleElement: <E extends Element_2>(elementType: E['type'], suchThat?: Partial<E>) => boolean;
    // (undocumented)
    canToggleMarks: <T extends Text_2>(marks: TextSpecifics<T>) => boolean;
    // (undocumented)
    createDefaultElement: EditorDefaultElementFactory;
    // (undocumented)
    defaultElementType: string;
    // (undocumented)
    deserializeNodes: (serializedNodes: string, errorMessage?: string) => Array<Element_2 | Text_2>;
    // (undocumented)
    formatVersion: number;
    // (undocumented)
    hasMarks: <T extends Text_2>(marks: TextSpecifics<T>) => boolean;
    // (undocumented)
    htmlDeserializer: HtmlDeserializer;
    // (undocumented)
    insertBetweenBlocks: (blockEntry: NodeEntry, edge: 'before' | 'after') => void;
    // (undocumented)
    isDefaultElement: (element: Element_2) => boolean;
    // (undocumented)
    isElementActive: <E extends Element_2>(elementType: E['type'], suchThat?: Partial<E>) => boolean;
    // (undocumented)
    onBlur: (event: FocusEvent_2<HTMLDivElement>) => void;
    // (undocumented)
    onDOMBeforeInput: (event: Event) => void;
    // (undocumented)
    onFocus: (event: FocusEvent_2<HTMLDivElement>) => void;
    // (undocumented)
    onKeyDown: (event: KeyboardEvent_2<HTMLDivElement>) => void;
    // (undocumented)
    registerElement: (plugin: EditorElementPlugin<any>) => void;
    // (undocumented)
    registerMark: (plugin: EditorMarkPlugin) => void;
    // (undocumented)
    renderElement: (props: RenderElementProps) => ReactElement;
    // (undocumented)
    renderLeaf: (props: RenderLeafProps) => ReactElement;
    // (undocumented)
    renderLeafChildren: (props: Omit<RenderLeafProps, 'attributes'>) => ReactElement;
    // (undocumented)
    serializeNodes: (nodes: Array<Descendant>, errorMessage?: string) => string;
    // (undocumented)
    slate: typeof Slate;
    // (undocumented)
    toggleElement: <E extends Element_2>(elementType: E['type'], suchThat?: Partial<E>) => void;
    // (undocumented)
    toggleMarks: <T extends Text_2>(marks: TextSpecifics<T>) => void;
    // (undocumented)
    upgradeFormatBySingleVersion: (node: Node_2, oldVersion: number) => Node_2;
}

// @public (undocumented)
export const withHeadings: ({ render }: {
    render: ElementRenderer<HeadingElement>;
}) => <E extends Editor_2>(editor: E) => E;

// @public (undocumented)
export const withHighlight: () => EditorPlugin;

// @public (undocumented)
export const withHorizontalRules: ({ render }: {
    render: ElementRenderer<HorizontalRuleElement>;
}) => <E extends Editor_2>(editor: E) => E;

// @public (undocumented)
export const withItalic: () => EditorPlugin;

// @public (undocumented)
export const withLists: ({ renderListItem, renderUnorderedList, renderOrderedList }: {
    renderListItem: ElementRenderer<ListItemElement>;
    renderOrderedList: ElementRenderer<OrderedListElement>;
    renderUnorderedList: ElementRenderer<UnorderedListElement>;
}) => <E extends Editor_2>(editor: E) => E;

// @public (undocumented)
export const withNewline: () => EditorPlugin;

// @public (undocumented)
export const withParagraphs: ({ render }: {
    render: ElementRenderer<ParagraphElement>;
}) => <E extends Editor_2>(editor: E) => E;

// @public (undocumented)
export const withPaste: (editor: Editor_2) => void;

// @public (undocumented)
export const withScrollTargets: ({ render }: {
    render: ElementRenderer<ScrollTargetElement>;
}) => <E extends Editor_2>(editor: E) => E;

// @public (undocumented)
export const withStrikeThrough: () => EditorPlugin;

// @public (undocumented)
export const withTables: ({ renderTable, renderTableCell, renderTableRow }: {
    renderTable: ElementRenderer<TableElement>;
    renderTableCell: ElementRenderer<TableCellElement>;
    renderTableRow: ElementRenderer<TableRowElement>;
}) => <E extends Editor_2>(editor: E) => E;

// @public (undocumented)
export const withUnderline: () => EditorPlugin;

// Warnings were encountered during analysis:
//
// src/types/htmlDeserializer.ts:18:4 - (ae-forgotten-export) The symbol "HtmlDeserializer" needs to be exported by the entry point index.d.ts

// (No @packageDocumentation comment for this package)

```
