import { Context } from 'react';
import { Editor } from 'slate';
import { EditorElement } from '@contember/react-slate-editor-base';
import { EditorPlugin } from '@contember/react-slate-editor-base';
import { Element as Element_2 } from 'slate';
import { EntityAccessor } from '@contember/react-binding';
import { EntityId } from '@contember/react-binding';
import type { FunctionComponent } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { NamedExoticComponent } from 'react';
import { Path } from 'slate';
import { Range as Range_2 } from 'slate';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { RenderElementProps } from 'slate-react';
import { SugaredRelativeEntityList } from '@contember/react-binding';
import { SugaredRelativeSingleField } from '@contember/react-binding';

/**
 * The Block component is used for wrapping fields in {@link BlockEditor} component.
 * @group Blocks and repeaters
 */
export declare const Block: FunctionComponent<BlockProps>;

/**
 * Marker for Content in Block Editor blocks
 *
 * This is deliberately not a Contember Component!
 *
 * @group Block Editor
 */
export declare const BlockContent: (props: ContentOutletProps) => any;

export declare const BlockEditor: NamedExoticComponent<BlockEditorProps>;

export declare interface BlockEditorProps {
    field: SugaredRelativeSingleField['field'];
    plugins?: EditorPlugin[];
    children?: ReactNode;
}

export declare interface BlockProps {
    name: string;
    render: ({}: BlockRendererProps) => ReactNode;
    children?: ReactNode;
}

export declare type BlockRendererProps = RenderElementProps & {
    isVoid: boolean;
};

export declare interface ContentOutletProps {
}

declare type CreateElementReferences = (referenceType: string, initialize?: EntityAccessor.BatchUpdatesHandler) => EntityAccessor;

/** @internal */
export declare const EditorBlockElementContext: Context<RenderElementProps>;

/** @internal */
export declare const EditorGetReferencedEntityContext: Context<GetReferencedEntity>;

export declare const EditorInlineReferencePortal: (props: EditorInlineReferenceTriggerProps) => JSX_2.Element | null;

export declare interface EditorInlineReferenceTriggerProps {
    referenceType: string;
    initializeReference?: EntityAccessor.BatchUpdatesHandler;
    children: ReactNode;
}

export declare interface EditorReferenceMethods {
    insertElementWithReference: InsertElementWithReference;
    createElementReference: CreateElementReferences;
}

/** @internal */
export declare const EditorReferenceMethodsContext: Context<EditorReferenceMethods>;

export declare const EditorReferenceTrigger: ({ referenceType, initialize, ...props }: EditorReferenceTriggerProps) => JSX_2.Element;

export declare interface EditorReferenceTriggerProps {
    referenceType: string;
    initialize?: EntityAccessor.BatchUpdatesHandler;
    children: ReactElement;
}

declare type GetReferencedEntity = (path: Path, id: EntityId) => EntityAccessor;

export declare interface InitializeReferenceContentProps {
    referenceId: EntityId;
    editor: Editor;
    selection: Range_2 | null;
    onSuccess: (options?: {
        createElement?: Partial<Element_2>;
    }) => void;
    onCancel: () => void;
}

declare type InsertElementWithReference = (element: Partial<Element_2> & {
    type: string;
}, referenceDiscriminant: string, initialize?: EntityAccessor.BatchUpdatesHandler) => void;

export declare interface ReferencesPluginArgs {
    field: SugaredRelativeEntityList['field'];
    discriminationField: SugaredRelativeSingleField['field'];
}

export declare const useEditorBlockElement: () => RenderElementProps;

export declare const useEditorGetReferencedEntity: () => GetReferencedEntity;

export declare const useEditorReferenceMethods: () => EditorReferenceMethods;

export declare const withReferences: (args: ReferencesPluginArgs) => EditorPlugin;

export declare const withSortable: ({ render: Sortable }: {
    render: (props: {
        element: EditorElement;
        children: ReactNode;
    }) => ReactNode;
}) => EditorPlugin;


export * from "@contember/react-slate-editor-base";

export { }
