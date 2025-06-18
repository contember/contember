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

export declare type AlignDirection = 'start' | 'center' | 'end' | 'justify' | undefined;

export declare interface AnchorElement extends Element_2 {
    type: typeof anchorElementType;
    href: string;
    children: Editor_2['children'];
}

export declare const anchorElementPlugin: ({ render }: {
    render: ElementRenderer<AnchorElement>;
}) => EditorElementPlugin<AnchorElement>;

export declare const anchorElementType: "anchor";

export declare const anchorHtmlDeserializer: HtmlDeserializerPlugin;

export declare const boldMark = "isBold";

export declare const boldMarkPlugin: EditorMarkPlugin;

export declare const codeMark = "isCode";

export declare const codeMarkPlugin: EditorMarkPlugin;

export declare const ContemberEditor: {
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

export declare const createAlignHandler: (direction: AlignDirection) => {
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

export declare const createEditor: ({ plugins, defaultElementType, entity, environment, children, }: CreateEditorOptions) => {
    editor: Editor_2;
    OuterWrapper: FunctionComponent<{
        children: ReactNode;
    }>;
    InnerWrapper: FunctionComponent<{
        children: ReactNode;
    }>;
};

export declare interface CreateEditorOptions extends CreateEditorPublicOptions {
    defaultElementType: string;
    entity: EntityAccessor;
    environment: Environment;
    children: ReactNode;
}

export declare interface CreateEditorPublicOptions {
    plugins?: EditorPlugin[];
}

export declare const createEmptyTableCellElement: () => {
    type: "tableCell";
    children: {
        text: string;
    }[];
};

export declare const createEmptyTableElement: (rowCount?: number, columnCount?: number) => {
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

export declare const createEmptyTableRowElement: (columnCount?: number) => {
    type: "tableRow";
    children: {
        type: "tableCell";
        children: {
            text: string;
        }[];
    }[];
};

export declare const createMarkHtmlDeserializer: (markType: string, tagMatcher: (el: HTMLElement) => boolean, attributeMatcher: (el: HTMLElement) => boolean) => HtmlDeserializerPlugin;

export declare type Editor = EditorWithEssentials<ReactEditor & HistoryEditor & BaseEditor>;

export declare type EditorAncestor = Ancestor;

export declare type EditorDefaultElementFactory = (children: Descendant[]) => Element_2;

export declare type EditorDescendant = Descendant;

export declare type EditorElement = {
    [K in string]: unknown;
} & {
    type: string;
    children: Array<Descendant>;
};

export declare interface EditorElementPlugin<T extends Element_2> {
    type: T['type'];
    render: ElementRenderer<T>;
    normalizeNode?: (args: {
        element: T;
        path: Path;
        editor: Editor_2;
        preventDefault: () => void;
    }) => void;
    isActive?: (args: {
        editor: Editor_2;
        suchThat?: Partial<T>;
    }) => boolean;
    isInline?: boolean;
    isVoid?: boolean | ((args: {
        element: T;
        editor: Editor_2;
    }) => boolean);
    canContainAnyBlocks?: boolean;
    toggleElement?: (args: {
        editor: Editor_2;
        suchThat?: Partial<T>;
    }) => void;
    acceptsAttributes?: (args: {
        editor: Editor_2;
        suchThat: Partial<T>;
    }) => boolean;
}

export declare const EditorElementTrigger: ({ elementType, suchThat, ...props }: EditorElementTriggerProps) => JSX_2.Element;

export declare interface EditorElementTriggerProps {
    elementType: string;
    suchThat?: Record<string, unknown>;
    children: ReactElement;
}

export declare const EditorGenericTrigger: ({ toggle, isActive, shouldDisplay, ...props }: EditorGenericTriggerProps) => JSX_2.Element | null;

export declare interface EditorGenericTriggerProps {
    isActive?: (args: {
        editor: Editor_2;
    }) => boolean;
    shouldDisplay?: (args: {
        editor: Editor_2;
    }) => boolean;
    toggle: (args: {
        editor: Editor_2;
    }) => void;
    children: ReactElement;
}

export declare interface EditorMarkPlugin {
    type: string;
    isHotKey: (e: KeyboardEvent) => boolean;
    render: FunctionComponent<RenderLeafProps>;
}

export declare const EditorMarkTrigger: ({ mark, ...props }: EditorMarkTriggerProps) => JSX_2.Element;

export declare interface EditorMarkTriggerProps {
    mark: string;
    children: ReactElement;
}

export declare type EditorPath = Path;

export declare type EditorPlugin = ((editor: Editor_2) => void) | {
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

export declare type EditorPluginWrapperProps = {
    children?: ReactNode;
    editor: Editor_2;
};

export declare type EditorPoint = Point;

export declare type EditorRange = Range_2;

export declare type EditorRenderElementProps = RenderElementProps;

export declare type EditorSelection = Selection_2;

export declare type EditorText = {
    [K in string]: unknown;
} & {
    text: string;
};

export { EditorTransforms }

export declare const EditorUtils: EditorInterface;

export declare type EditorWithEssentials<E extends BaseEditor> = WithEssentials & E;

export declare const EditorWrapNodeTrigger: ({ elementType, suchThat, selection, ...props }: EditorWrapNodeTriggerProps) => JSX_2.Element;

export declare interface EditorWrapNodeTriggerProps {
    elementType: string;
    selection?: Selection_2;
    suchThat?: Record<string, unknown>;
    children: ReactElement;
    onClick?: MouseEventHandler<HTMLElement>;
}

export declare const ejectHeadingElement: (editor: Editor_2, elementPath: Path) => void;

export declare interface ElementDataAttributes {
    [dataAttribute: string]: Scalar;
}

export declare type ElementRenderer<T extends Element_2> = FunctionComponent<RenderElementProps & {
    element: T;
}>;

export declare const getTableElementColumnCount: (element: TableElement) => number;

export declare const getTableElementRowCount: (element: TableElement) => number;

export declare interface HeadingElement extends Element_2 {
    type: typeof headingElementType;
    level: 1 | 2 | 3 | 4 | 5 | 6;
    isNumbered?: boolean;
    align?: AlignDirection;
    children: Editor_2['children'];
}

export declare const headingElementPlugin: ({ render }: {
    render: ElementRenderer<HeadingElement>;
}) => EditorElementPlugin<HeadingElement>;

export declare const headingElementType: "heading";

export declare const headingHtmlDeserializer: HtmlDeserializerPlugin;

export declare const highlightMark = "isHighlighted";

export declare const highlightMarkPlugin: EditorMarkPlugin;

export declare interface HorizontalRuleElement extends Element_2 {
    type: typeof horizontalRuleElementType;
    children: Editor_2['children'];
}

export declare const horizontalRuleElementPlugin: ({ render }: {
    render: ElementRenderer<HorizontalRuleElement>;
}) => EditorElementPlugin<HorizontalRuleElement>;

export declare const horizontalRuleElementType: "horizontalRule";

declare class HtmlDeserializer {
    createDefaultElement: EditorDefaultElementFactory;
    private plugins;
    constructor(createDefaultElement: EditorDefaultElementFactory, plugins: HtmlDeserializerPlugin[]);
    registerPlugin(plugin: HtmlDeserializerPlugin, prepend?: boolean): void;
    processNodeListPaste(nodeList: Node[], cumulativeTextAttrs: TextAttrs): {
        texts: Descendant[];
        elements?: undefined;
    } | {
        elements: Element_2[];
        texts?: undefined;
    } | null;
    deserializeInline(list: NodeList | Node[], cumulativeTextAttrs: TextAttrs): Descendant[];
    deserializeBlocks(list: Node[], cumulativeTextAttrs: TextAttrs): Descendant[];
    private deserializeTextNode;
    private processInlinePaste;
    private processWithAttributeProcessor;
    private processBlockPaste;
}

export declare type HtmlDeserializerNextCallback = (children: NodeList | Node[], cumulativeTextAttrs: HtmlDeserializerTextAttrs) => Descendant[];

export declare type HtmlDeserializerNodesWithType = {
    texts: Descendant[];
    elements?: undefined;
} | {
    elements: Element_2[];
    texts?: undefined;
} | null;

export declare interface HtmlDeserializerPlugin {
    processBlockPaste?: (args: {
        deserializer: HtmlDeserializer;
        element: HTMLElement;
        next: HtmlDeserializerNextCallback;
        cumulativeTextAttrs: HtmlDeserializerTextAttrs;
    }) => Element_2[] | Element_2 | null;
    processInlinePaste?: (args: {
        deserializer: HtmlDeserializer;
        element: HTMLElement;
        next: HtmlDeserializerNextCallback;
        cumulativeTextAttrs: HtmlDeserializerTextAttrs;
    }) => Descendant[] | Descendant | null;
    processAttributesPaste?: (args: {
        deserializer: HtmlDeserializer;
        element: HTMLElement;
        cumulativeTextAttrs: HtmlDeserializerTextAttrs;
    }) => HtmlDeserializerTextAttrs;
    processNodeListPaste?: (args: {
        deserializer: HtmlDeserializer;
        nodeList: Node[];
        cumulativeTextAttrs: HtmlDeserializerTextAttrs;
    }) => HtmlDeserializerNodesWithType;
}

export declare interface HtmlDeserializerTextAttrs {
    [key: string]: any;
}

export declare const isAnchorElement: (element: Node_2) => element is AnchorElement;

export declare const isAnchorElementActive: (editor: Editor_2) => boolean;

export declare const isHeadingElement: (element: Node_2, suchThat?: Partial<HeadingElement>) => element is HeadingElement;

export declare const isHorizontalRuleElement: (element: Node_2) => element is HorizontalRuleElement;

export declare const isHorizontalRuleElementActive: (editor: Editor_2) => boolean;

export declare const isListItemElement: (element: Node_2, suchThat?: Partial<ListItemElement>) => element is ListItemElement;

export declare const isOrderedListElement: (element: Node_2, suchThat?: Partial<OrderedListElement>) => element is OrderedListElement;

export declare const isParagraphElement: (element: Node_2, suchThat?: Partial<ParagraphElement>) => element is ParagraphElement;

export declare const isScrollTargetElement: (element: Node_2) => element is ScrollTargetElement;

export declare const isScrollTargetElementActive: (editor: Editor_2) => boolean;

export declare const isTableCellElement: (element: Node_2) => element is TableCellElement;

export declare const isTableElement: (element: Node_2) => element is TableElement;

export declare const isTableRowElement: (element: Node_2) => element is TableRowElement;

export declare const isUnorderedListElement: (element: Node_2, suchThat?: Partial<UnorderedListElement>) => element is UnorderedListElement;

export declare const italicMark = "isItalic";

export declare const italicMarkPlugin: EditorMarkPlugin;

export declare interface ListElementProperties {
    ordered: boolean;
    properties: Record<string, unknown>;
}

export declare const listHtmlDeserializerFactory: ({ getListElementProperties }?: ListHtmlDeserializerOptions) => HtmlDeserializerPlugin;

export declare interface ListHtmlDeserializerOptions {
    getListElementProperties?: (text: string) => ListElementProperties;
}

export declare interface ListItemElement extends Element_2 {
    type: typeof listItemElementType;
    children: Editor_2['children'];
}

export declare const listItemElementPlugin: ({ render }: {
    render: ElementRenderer<ListItemElement>;
}) => EditorElementPlugin<ListItemElement>;

export declare const listItemElementType: "listItem";

export declare interface OrderedListElement extends Element_2 {
    type: typeof orderedListElementType;
    children: Editor_2['children'];
}

export declare const orderedListElementPlugin: ({ render }: {
    render: ElementRenderer<OrderedListElement>;
}) => EditorElementPlugin<OrderedListElement>;

export declare const orderedListElementType: "orderedList";

export declare interface ParagraphElement extends Element_2 {
    type: typeof paragraphElementType;
    isNumbered?: boolean;
    children: Editor_2['children'];
    align?: AlignDirection;
}

export declare const paragraphElementPlugin: ({ render }: {
    render: ElementRenderer<ParagraphElement>;
}) => EditorElementPlugin<ParagraphElement>;

export declare const paragraphElementType: "paragraph";

export declare const paragraphHtmlDeserializer: HtmlDeserializerPlugin;

/**
 * Rich text field supports more advanced formatting capabilities. Output of this field is a JSON.
 *
 * @group Form Fields
 */
export declare const RichTextEditor: FunctionComponent<RichTextEditorProps>;

export declare type RichTextEditorProps = FieldBasicProps & CreateEditorPublicOptions & {
    children: React.ReactNode;
};

export declare interface ScrollTargetElement extends Element_2 {
    type: typeof scrollTargetElementType;
    identifier: string;
    children: Editor_2['children'];
}

export declare const scrollTargetElementPlugin: ({ render }: {
    render: ElementRenderer<ScrollTargetElement>;
}) => EditorElementPlugin<ScrollTargetElement>;

export declare const scrollTargetElementType: "scrollTarget";

export declare interface SerializableEditorNode {
    formatVersion: number;
    children: Array<Element_2 | Text_2>;
}

export declare const strikeThroughMark = "isStruckThrough";

export declare const strikeThroughPlugin: EditorMarkPlugin;

export declare interface TableCellElement extends Element_2 {
    type: typeof tableCellElementType;
    children: Editor_2['children'];
    headerScope?: 'row';
    justify?: 'start' | 'center' | 'end';
}

export declare const tableCellElementPlugin: ({ render }: {
    render: ElementRenderer<TableCellElement>;
}) => EditorElementPlugin<TableCellElement>;

export declare const tableCellElementType: "tableCell";

export declare interface TableElement extends Element_2 {
    type: typeof tableElementType;
    children: Editor_2['children'];
}

export declare const tableElementPlugin: ({ render }: {
    render: ElementRenderer<TableElement>;
}) => EditorElementPlugin<TableElement>;

export declare const tableElementType: "table";

export declare class TableModifications {
    static deleteTableColumn(editor: Editor_2, element: TableElement, index: number): void;
    static addTableRow(editor: Editor_2, element: TableElement, index?: number): void;
    static addTableColumn(editor: Editor_2, element: TableElement, index?: number): void;
    static justifyTableColumn(editor: Editor_2, element: TableElement, columnIndex: number, direction: TableCellElement['justify']): void;
    static toggleTableRowHeaderScope(editor: Editor_2, element: TableElement, rowIndex: number, scope: TableRowElement['headerScope']): void;
    static toggleTableColumnHeaderScope(editor: Editor_2, element: TableElement, columnIndex: number, scope: TableCellElement['headerScope']): void;
    static deleteTableRow(editor: Editor_2, element: TableElement, index: number): void;
}

export declare interface TableRowElement extends Element_2 {
    type: typeof tableRowElementType;
    children: Editor_2['children'];
    headerScope?: 'table';
}

export declare const tableRowElementPlugin: ({ render }: {
    render: ElementRenderer<TableRowElement>;
}) => EditorElementPlugin<TableRowElement>;

export declare const tableRowElementType: "tableRow";

declare interface TextAttrs {
    [key: string]: any;
}

export declare type TextSpecifics<Text extends Text_2> = Omit<Text, 'text'>;

export declare const underlineMark = "isUnderlined";

export declare const underlineMarkPlugin: EditorMarkPlugin;

export declare interface UnorderedListElement extends Element_2 {
    type: typeof unorderedListElementType;
    children: Editor_2['children'];
}

export declare const unorderedListElementPlugin: ({ render }: {
    render: ElementRenderer<UnorderedListElement>;
}) => EditorElementPlugin<UnorderedListElement>;

export declare const unorderedListElementType: "unorderedList";

export declare const withAnchors: ({ render }: {
    render: ElementRenderer<AnchorElement>;
}) => <E extends Editor_2>(editor: E) => E;

export declare const withBold: () => EditorPlugin;

export declare const withCode: () => EditorPlugin;

export declare interface WithEssentials {
    slate: typeof Slate;
    htmlDeserializer: HtmlDeserializer;
    formatVersion: number;
    defaultElementType: string;
    isDefaultElement: (element: Element_2) => boolean;
    createDefaultElement: EditorDefaultElementFactory;
    insertBetweenBlocks: (blockEntry: NodeEntry, edge: 'before' | 'after') => void;
    canToggleMarks: <T extends Text_2>(marks: TextSpecifics<T>) => boolean;
    hasMarks: <T extends Text_2>(marks: TextSpecifics<T>) => boolean;
    toggleMarks: <T extends Text_2>(marks: TextSpecifics<T>) => void;
    canToggleElement: <E extends Element_2>(elementType: E['type'], suchThat?: Partial<E>) => boolean;
    isElementActive: <E extends Element_2>(elementType: E['type'], suchThat?: Partial<E>) => boolean;
    toggleElement: <E extends Element_2>(elementType: E['type'], suchThat?: Partial<E>) => void;
    acceptsAttributes: <E extends Element_2>(elementType: E['type'], suchThat: Partial<E>) => boolean;
    canContainAnyBlocks: (element: Element_2 | Editor_2) => boolean;
    serializeNodes: (nodes: Array<Descendant>, errorMessage?: string) => string;
    deserializeNodes: (serializedNodes: string, errorMessage?: string) => Array<Element_2 | Text_2>;
    upgradeFormatBySingleVersion: (node: Node_2, oldVersion: number) => Node_2;
    registerElement: (plugin: EditorElementPlugin<any>) => void;
    registerMark: (plugin: EditorMarkPlugin) => void;
    renderElement: (props: RenderElementProps) => ReactElement;
    renderLeaf: (props: RenderLeafProps) => ReactElement;
    renderLeafChildren: (props: Omit<RenderLeafProps, 'attributes'>) => ReactElement;
    onDOMBeforeInput: (event: Event) => void;
    onKeyDown: (event: KeyboardEvent_2<HTMLDivElement>) => void;
    onFocus: (event: FocusEvent_2<HTMLDivElement>) => void;
    onBlur: (event: FocusEvent_2<HTMLDivElement>) => void;
}

export declare const withHeadings: ({ render }: {
    render: ElementRenderer<HeadingElement>;
}) => <E extends Editor_2>(editor: E) => E;

export declare const withHighlight: () => EditorPlugin;

export declare const withHorizontalRules: ({ render }: {
    render: ElementRenderer<HorizontalRuleElement>;
}) => <E extends Editor_2>(editor: E) => E;

export declare const withItalic: () => EditorPlugin;

export declare const withLists: ({ renderListItem, renderUnorderedList, renderOrderedList }: {
    renderListItem: ElementRenderer<ListItemElement>;
    renderOrderedList: ElementRenderer<OrderedListElement>;
    renderUnorderedList: ElementRenderer<UnorderedListElement>;
}) => <E extends Editor_2>(editor: E) => E;

export declare const withNewline: () => EditorPlugin;

export declare const withParagraphs: ({ render }: {
    render: ElementRenderer<ParagraphElement>;
}) => <E extends Editor_2>(editor: E) => E;

export declare const withPaste: (editor: Editor_2) => void;

export declare const withScrollTargets: ({ render }: {
    render: ElementRenderer<ScrollTargetElement>;
}) => <E extends Editor_2>(editor: E) => E;

export declare const withStrikeThrough: () => EditorPlugin;

export declare const withTables: ({ renderTable, renderTableCell, renderTableRow }: {
    renderTable: ElementRenderer<TableElement>;
    renderTableCell: ElementRenderer<TableCellElement>;
    renderTableRow: ElementRenderer<TableRowElement>;
}) => <E extends Editor_2>(editor: E) => E;

export declare const withUnderline: () => EditorPlugin;

export { }
