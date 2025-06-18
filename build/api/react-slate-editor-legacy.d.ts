import { ChildrenAnalyzer } from '@contember/react-multipass-rendering';
import { ComponentType } from 'react';
import { Context } from 'react';
import { CreateEditorPublicOptions } from '@contember/react-slate-editor-base';
import { Descendant } from 'slate';
import { Editor } from 'slate';
import { EditorElementPlugin } from '@contember/react-slate-editor-base';
import { Element as Element_2 } from 'slate';
import { EntityAccessor } from '@contember/react-binding';
import { EntityId } from '@contember/react-binding';
import { Environment } from '@contember/react-binding';
import { FieldAccessor } from '@contember/react-binding';
import { FieldValue } from '@contember/react-binding';
import { FunctionComponent } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { Node as Node_2 } from 'slate';
import { OptionallyVariableFieldValue } from '@contember/react-binding';
import { Path } from 'slate';
import { PathRef } from 'slate';
import { Range as Range_2 } from 'slate';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { RelativeSingleField } from '@contember/react-binding';
import { RenderElementProps } from 'slate-react';
import * as Slate from 'slate';
import { SugaredFieldProps } from '@contember/react-binding';
import { SugaredRelativeEntityList } from '@contember/react-binding';
import { SugaredRelativeSingleField } from '@contember/react-binding';

/**
 * The Block component is used for wrapping fields in {@link BlockRepeater}, {@link BlockEditor} or {@link DiscriminatedBlocks} components.
 *
 * @example
 * ```
 * <Block discriminateBy="gallery" label="Gallery" />
 * ```

 * @group Blocks and repeaters
 */
export declare const Block: FunctionComponent<BlockProps>;

export declare const blockAnalyzer: ChildrenAnalyzer<BlockProps, never, Environment<Environment.AnyNode | undefined>>;

/**
 * The `BlockEditor` component is the main component of the editor. It is responsible for rendering the content editor.
 *
 * @group Blocks and repeaters
 */
export declare const BlockEditor: FunctionComponent<BlockEditorProps> & {
    ContentOutlet: (props: ContentOutletProps) => ReactElement | null;
};

export declare interface BlockEditorProps extends SugaredRelativeEntityList, CreateEditorPublicOptions {
    contentField: SugaredRelativeSingleField['field'];
    sortableBy: SugaredRelativeSingleField['field'];
    children?: ReactNode;
    referencesField?: SugaredRelativeEntityList | string;
    referenceDiscriminationField?: SugaredRelativeSingleField['field'];
    monolithicReferencesMode?: boolean;
    renderReference?: ComponentType<ReferenceElementRendererProps>;
    embedReferenceDiscriminateBy?: SugaredDiscriminateBy;
    embedContentDiscriminationField?: SugaredRelativeSingleField['field'];
    embedHandlers?: Iterable<EmbedHandler>;
    renderSortableBlock: OverrideRenderElementOptions['renderSortableBlock'];
}

export declare interface BlockProps {
    /**
     * Field to discriminate by.
     */
    discriminateBy: SugaredDiscriminateBy;
    label?: ReactNode;
    description?: ReactNode;
    alternate?: ReactNode;
    children?: ReactNode;
}

export declare interface ContentOutletProps {
    placeholder?: string;
}

export declare type CreateElementReferences = (editor: Editor, targetPath: Slate.Path, referenceDiscriminant: FieldValue, initialize?: EntityAccessor.BatchUpdatesHandler) => EntityAccessor;

export declare const createReferenceElementPlugin: (args: ReferenceElementOptions) => EditorElementPlugin<ReferenceElement>;

export declare interface DiscriminatedDatum {
    discriminateBy: SugaredDiscriminateBy;
}

export declare const EditorInlineReferencePortal: (props: EditorInlineReferenceTriggerProps) => JSX_2.Element | null;

export declare interface EditorInlineReferenceTriggerProps {
    referenceType: OptionallyVariableFieldValue;
    initializeReference?: EntityAccessor.BatchUpdatesHandler;
    children: ReactNode;
}

export declare interface EditorReferenceBlock extends BlockProps {
    template: EditorTemplate;
}

export declare type EditorReferenceBlocks = NormalizedDiscriminatedData<EditorReferenceBlock>;

/** @internal */
export declare const EditorReferenceBlocksContext: Context<EditorReferenceBlocks>;

export declare const EditorReferenceTrigger: ({ referenceType, ...props }: EditorReferenceTriggerProps) => JSX_2.Element;

export declare interface EditorReferenceTriggerProps {
    referenceType: OptionallyVariableFieldValue;
    children: ReactElement;
}

export declare type EditorTemplate = undefined | {
    blockContent: EditorTemplateAtom<ContentOutletProps> | undefined;
};

declare interface EditorTemplateAtom<Value> {
    nodeBefore: ReactNode;
    value: Value;
    nodeAfter: ReactNode;
}

export declare type EditorWithBlocks = Editor & WithBlockElements;

export declare interface ElementWithReference extends Element_2 {
    referenceId: EntityId;
}

export declare interface EmbedHandler<EmbedArtifacts = any> {
    debugName: string;
    staticRender: (environment: Environment) => ReactNode;
    handleSource: (source: string, url: URL | undefined) => undefined | EmbedArtifacts | Promise<EmbedArtifacts | undefined>;
    renderEmbed: () => ReactNode;
    populateEmbedData: (options: PopulateEmbedDataOptions<EmbedArtifacts>) => void;
    discriminateBy: SugaredDiscriminateBy;
}

export declare const EmbedHandlers: {
    GoogleForm: typeof GoogleFormEmbedHandler;
    YouTube: typeof YouTubeEmbedHandler;
    Vimeo: typeof VimeoEmbedHandler;
    SoundCloud: typeof SoundCloudEmbedHandler;
    Spotify: typeof SpotifyEmbedHandler;
};

export declare const getDiscriminatedBlock: (blocks: NormalizedBlocks, field: FieldAccessor | FieldValue) => ResolvedDiscriminatedDatum<BlockProps> | undefined;

export declare const getDiscriminatedDatum: <Datum>(data: NormalizedDiscriminatedData<Datum>, discriminant: FieldAccessor | FieldValue) => ResolvedDiscriminatedDatum<Datum> | undefined;

declare class GoogleFormEmbedHandler implements EmbedHandler<string> {
    private readonly options;
    readonly debugName = "GoogleForm";
    readonly discriminateBy: SugaredDiscriminateBy;
    constructor(options: GoogleFormEmbedHandler.Options);
    staticRender(): JSX_2.Element;
    handleSource(source: string, url: URL | undefined): undefined | string;
    renderEmbed(): string | number | boolean | Iterable<ReactNode> | JSX_2.Element | null | undefined;
    populateEmbedData({ entity, embedArtifacts }: PopulateEmbedDataOptions<string>): void;
}

declare namespace GoogleFormEmbedHandler {
    interface Options {
        nonEmbedLinkWarning?: string;
        render?: () => ReactNode;
        googleFormIdField: SugaredFieldProps['field'];
        discriminateBy: SugaredDiscriminateBy;
    }
    interface RendererOptions {
        googleFormIdField: SugaredFieldProps['field'];
    }
    const Renderer: NamedExoticComponent<RendererOptions>;
}

export declare const initBlockEditor: ({ editor, ...options }: InitEditorOptions & {
    editor: Editor;
}) => void;

export declare interface InitEditorOptions extends OverrideCreateElementReferenceOptions, ReferenceElementOptions, OverrideInsertDataOptions, OverrideRenderElementOptions, OverrideInsertElementWithReferenceOptions {
}

export declare interface InitializeReferenceContentProps {
    referenceId: EntityId;
    editor: EditorWithBlocks;
    selection: Range_2 | null;
    onSuccess: (options?: {
        createElement?: Partial<Element_2>;
    }) => void;
    onCancel: () => void;
}

export declare type InsertElementWithReference = (element: Omit<Element_2, 'referenceId'>, referenceDiscriminant: FieldValue, initialize?: EntityAccessor.BatchUpdatesHandler) => void;

export declare const isElementWithReference: (candidate: Node_2) => candidate is ElementWithReference;

export declare const isReferenceElement: (node: Node_2) => node is ReferenceElement;

export declare type NormalizedBlocks = NormalizedDiscriminatedData<BlockProps>;

export declare type NormalizedDiscriminatedData<Datum> = Map<FieldValue, ResolvedDiscriminatedDatum<Datum>>;

export declare type NormalizedEmbedHandlers = NormalizedDiscriminatedData<EmbedHandler>;

export declare interface OverrideCreateElementReferenceOptions {
    createElementReferences: CreateElementReferences;
}

export declare interface OverrideInsertDataOptions {
    embedHandlers: NormalizedEmbedHandlers | undefined;
    embedReferenceDiscriminateBy: FieldValue | undefined;
    embedContentDiscriminationField: RelativeSingleField | undefined;
}

export declare interface OverrideInsertElementWithReferenceOptions {
    insertElementWithReference: InsertElementWithReference;
}

declare interface OverrideRenderElementOptions {
    renderSortableBlock: ComponentType<{
        children: ReactNode;
        element: Element_2;
    }>;
}

export declare interface PopulateEmbedDataOptions<EmbedArtifacts = any> {
    source: string;
    embedArtifacts: EmbedArtifacts;
    entity: EntityAccessor;
}

export declare const prepareElementForInsertion: (editor: Editor, node: Node_2) => Path;

export declare interface ReferenceElement extends ElementWithReference {
    type: typeof referenceElementType;
}

export declare interface ReferenceElementOptions {
    referenceDiscriminationField: RelativeSingleField | undefined;
    editorReferenceBlocks: EditorReferenceBlocks;
    embedHandlers: NormalizedEmbedHandlers | undefined;
    embedReferenceDiscriminateBy: FieldValue | undefined;
    embedContentDiscriminationField: RelativeSingleField | undefined;
    embedSubBlocks: NormalizedBlocks | undefined;
    getReferencedEntity: (path: Path, referenceId: EntityId) => EntityAccessor;
    renderReference: ComponentType<ReferenceElementRendererProps> | undefined;
}

export declare interface ReferenceElementRendererProps extends RenderElementProps, ReferenceElementOptions {
    element: ReferenceElement;
    referenceDiscriminationField: RelativeSingleField;
}

export declare const referenceElementType: "reference";

export declare interface ResolvedDiscriminatedDatum<Datum> {
    discriminateBy: FieldValue;
    datum: Datum;
}

export declare const SortedBlocksContext: Context<EntityAccessor[]>;

declare class SoundCloudEmbedHandler implements EmbedHandler<string> {
    private readonly options;
    readonly debugName = "SoundCloud";
    readonly discriminateBy: SugaredDiscriminateBy;
    constructor(options: SoundCloudEmbedHandler.Options);
    staticRender(): JSX_2.Element;
    handleSource(source: string, url: URL | undefined): undefined | string;
    renderEmbed(): string | number | boolean | Iterable<ReactNode> | JSX_2.Element | null | undefined;
    populateEmbedData({ entity, embedArtifacts }: PopulateEmbedDataOptions<string>): void;
}

declare namespace SoundCloudEmbedHandler {
    interface Options {
        render?: () => ReactNode;
        soundCloudIdField: SugaredFieldProps['field'];
        discriminateBy: SugaredDiscriminateBy;
    }
    interface RendererOptions {
        soundCloudIdField: SugaredFieldProps['field'];
    }
    const Renderer: NamedExoticComponent<RendererOptions>;
}

declare class SpotifyEmbedHandler implements EmbedHandler<SpotifyEmbedHandler.Artifacts> {
    private readonly options;
    readonly debugName = "Spotify";
    readonly discriminateBy: SugaredDiscriminateBy;
    constructor(options: SpotifyEmbedHandler.Options);
    staticRender(): JSX_2.Element;
    handleSource(source: string, url: URL | undefined): undefined | SpotifyEmbedHandler.Artifacts;
    renderEmbed(): string | number | boolean | Iterable<ReactNode> | JSX_2.Element | null | undefined;
    populateEmbedData({ entity, embedArtifacts }: PopulateEmbedDataOptions<SpotifyEmbedHandler.Artifacts>): void;
}

declare namespace SpotifyEmbedHandler {
    interface Artifacts {
        type: string;
        id: string;
    }
    interface Options {
        render?: () => ReactNode;
        spotifyTypeField: SugaredFieldProps['field'];
        spotifyIdField: SugaredFieldProps['field'];
        discriminateBy: SugaredDiscriminateBy;
    }
    interface RendererOptions {
        spotifyTypeField: SugaredFieldProps['field'];
        spotifyIdField: SugaredFieldProps['field'];
    }
    const Renderer: NamedExoticComponent<RendererOptions>;
}

export declare type SugaredDiscriminateBy = OptionallyVariableFieldValue;

export declare const useBlockEditorSlateNodes: ({ editor, blockElementCache, blockElementPathRefs, blockContentField, topLevelBlocks, }: UseBlockEditorSlateNodesOptions) => Descendant[];

export declare interface UseBlockEditorSlateNodesOptions {
    editor: Editor;
    blockElementCache: WeakMap<EntityAccessor, Element_2>;
    blockElementPathRefs: Map<EntityId, PathRef>;
    blockContentField: SugaredFieldProps['field'];
    topLevelBlocks: EntityAccessor[];
}

export declare const useBlockProps: (children: ReactNode, env: Environment) => BlockProps[];

export declare const useDiscriminatedData: <Datum extends DiscriminatedDatum = DiscriminatedDatum>(source: Iterable<Datum>) => NormalizedDiscriminatedData<Datum>;

export declare const useEditorReferenceBlocks: () => EditorReferenceBlocks;

export declare const useNormalizedBlocks: (children: ReactNode, env: Environment) => NormalizedBlocks;

declare class VimeoEmbedHandler implements EmbedHandler<string> {
    private readonly options;
    readonly debugName = "Vimeo";
    readonly discriminateBy: SugaredDiscriminateBy;
    constructor(options: VimeoEmbedHandler.Options);
    staticRender(): JSX_2.Element;
    handleSource(source: string, url: URL | undefined): undefined | string;
    renderEmbed(): string | number | boolean | Iterable<ReactNode> | JSX_2.Element | null | undefined;
    populateEmbedData({ entity, embedArtifacts }: PopulateEmbedDataOptions<string>): void;
}

declare namespace VimeoEmbedHandler {
    interface Options {
        render?: () => ReactNode;
        vimeoIdField: SugaredFieldProps['field'];
        discriminateBy: SugaredDiscriminateBy;
    }
    interface RendererOptions {
        vimeoIdField: SugaredFieldProps['field'];
    }
    const Renderer: NamedExoticComponent<RendererOptions>;
}

export declare interface WithBlockElements {
    slate: typeof Slate;
    getReferencedEntity: (referenceId: string) => EntityAccessor;
    createElementReference: (targetPath: Slate.Path, referenceDiscriminant: FieldValue, initialize?: EntityAccessor.BatchUpdatesHandler) => EntityAccessor;
    insertElementWithReference: <Element extends Slate.Element>(element: Omit<Element, 'referenceId'>, referenceDiscriminant: FieldValue, initialize?: EntityAccessor.BatchUpdatesHandler) => void;
}

declare class YouTubeEmbedHandler implements EmbedHandler<string> {
    private readonly options;
    readonly debugName = "YouTube";
    readonly discriminateBy: SugaredDiscriminateBy;
    constructor(options: YouTubeEmbedHandler.Options);
    staticRender(): JSX_2.Element;
    handleSource(source: string, url: URL | undefined): undefined | string;
    renderEmbed(): string | number | boolean | Iterable<ReactNode> | JSX_2.Element | null | undefined;
    populateEmbedData({ entity, embedArtifacts }: PopulateEmbedDataOptions<string>): void;
}

declare namespace YouTubeEmbedHandler {
    interface Options {
        render?: () => ReactNode;
        youTubeIdField: SugaredFieldProps['field'];
        discriminateBy: SugaredDiscriminateBy;
    }
    interface RendererOptions {
        youTubeIdField: SugaredFieldProps['field'];
    }
    const Renderer: NamedExoticComponent<RendererOptions>;
}


export * from "@contember/react-slate-editor-base";

export { }
