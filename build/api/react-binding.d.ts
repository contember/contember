import type { Alias } from '@contember/binding';
import type { BindingOperations } from '@contember/binding';
import { ComponentType } from 'react';
import { DataBinding } from '@contember/binding';
import { DataBindingEventListenerMap } from '@contember/binding';
import { EntityAccessor } from '@contember/binding';
import type { EntityFieldMarkersContainer } from '@contember/binding';
import type { EntityFieldsWithHoistablesMarker } from '@contember/binding';
import { EntityListAccessor } from '@contember/binding';
import { Environment } from '@contember/binding';
import { ErrorPersistResult } from '@contember/binding';
import { ExtendTreeOptions } from '@contember/binding';
import type { FieldAccessor } from '@contember/binding';
import type { FieldMarker } from '@contember/binding';
import type { FieldName } from '@contember/binding';
import { FieldValue } from '@contember/binding';
import { Filter } from '@contember/binding';
import type { GetEntityByKey } from '@contember/binding';
import { GraphQlClientError } from '@contember/react-client';
import type { HasManyRelationMarker } from '@contember/binding';
import type { HasOneRelationMarker } from '@contember/binding';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { MarkerTreeRoot } from '@contember/binding';
import { NamedExoticComponent } from 'react';
import type { Persist } from '@contember/binding';
import { PropsWithChildren } from 'react';
import * as React_2 from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import type { RelativeEntityList } from '@contember/binding';
import type { RelativeSingleEntity } from '@contember/binding';
import { RelativeSingleField } from '@contember/binding';
import { SuccessfulPersistResult } from '@contember/binding';
import type { SugaredParentEntityParameters } from '@contember/binding';
import { SugaredQualifiedEntityList } from '@contember/binding';
import { SugaredQualifiedSingleEntity } from '@contember/binding';
import { SugaredRelativeEntityList } from '@contember/binding';
import { SugaredRelativeSingleEntity } from '@contember/binding';
import { SugaredRelativeSingleField } from '@contember/binding';
import type { SugaredUnconstrainedQualifiedEntityList } from '@contember/binding';
import type { SugaredUnconstrainedQualifiedSingleEntity } from '@contember/binding';
import type { TreeRootAccessor } from '@contember/binding';
import { TreeRootId } from '@contember/binding';

export declare function AccessorProvider(props: EntityProviderProps): JSX_2.Element;

/**
 * @group Data binding
 */
export declare const AccessorTree: {
    ({ state, children }: AccessorTreeProps): JSX_2.Element;
    displayName: string;
};

export declare interface AccessorTreeProps {
    state: AccessorTreeState;
    children: ReactNode;
}

export declare type AccessorTreeState = InitializingAccessorTreeState | InitializedAccessorTreeState | ErrorAccessorTreeState;

export declare type AccessorTreeStateAction = {
    type: 'setData';
    data: TreeRootAccessor<ReactNode>;
    binding: DataBinding<ReactNode>;
} | {
    type: 'failWithError';
    error: GraphQlClientError;
    binding: DataBinding<ReactNode>;
} | {
    type: 'reset';
    binding: DataBinding<ReactNode>;
    environment: Environment;
};

export declare interface AccessorTreeStateMetadata {
    initialize: (() => void) | undefined;
}

export declare interface AccessorTreeStateOptions {
    children?: ReactNode;
}

export declare const addEntityAtIndex: (entityList: EntityListAccessor, sortableByField: RelativeSingleField, index: number, preprocess?: EntityAccessor.BatchUpdatesHandler) => void;

export declare function BindingOperationsProvider(props: BindingOperationsProviderProps): JSX_2.Element;

export declare interface BindingOperationsProviderProps {
    bindingOperations: BindingOperations<ReactNode> | undefined;
    children: ReactNode;
}

export declare interface BranchMarkerProvider<Props extends {} = any> {
    generateBranchMarker: (props: Props, fields: EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer, environment: Environment) => HasOneRelationMarker | HasManyRelationMarker | EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker;
}

export declare type CompleteMarkerProvider<Props extends {} = any, NonStaticPropNames extends keyof Props = never> = EnvironmentDeltaProvider<Props> & LeafMarkerProvider<Props> & BranchMarkerProvider<Props> & StaticRenderProvider<Props, NonStaticPropNames>;

export declare function Component<Props extends {}>(statelessRender: EnvironmentAwareFunctionComponent<Props>, displayName?: string): NamedExoticComponent<Props>;

export declare function Component<Props extends {}, NonStaticPropNames extends keyof Props = never>(statefulRender: EnvironmentAwareFunctionComponent<Props>, staticRender: (props: StaticRenderProviderProps<Props, NonStaticPropNames>, environment: Environment) => ReactNode, displayName?: string): NamedExoticComponent<Props>;

export declare function Component<Props extends {}, NonStaticPropNames extends keyof Props = never>(statefulRender: EnvironmentAwareFunctionComponent<Props>, markerProvisions: MarkerProvider<Props, NonStaticPropNames>, displayName?: string): NamedExoticComponent<Props>;

/**
 * The `DataBindingProvider` is a root component for all other data binding related components.
 *
 * @example
 * ```
 * <DataBindingProvider stateComponent={FeedbackRenderer} />
 * ```
 *
 * @group Data binding
 */
export declare const DataBindingProvider: <StateProps>(props: DataBindingProviderProps<StateProps>) => ReactElement;

export declare type DataBindingProviderProps<StateProps> = {
    refreshOnPersist?: boolean;
    skipStateUpdateAfterPersist?: boolean;
    children?: ReactNode;
} & DataBindingProviderStateComponent<StateProps>;

export declare type DataBindingProviderStateComponent<StateProps> = {
    stateComponent: ComponentType<StateProps & DataBindingStateComponentProps>;
    stateProps?: StateProps;
};

export declare interface DataBindingStateComponentProps {
    accessorTreeState: AccessorTreeState;
    children?: ReactNode;
}

/**
 * @group Data binding
 */
export declare const DeferredSubTrees: React.NamedExoticComponent<DeferredSubTreesProps>;

export declare interface DeferredSubTreesProps {
    fallback: ReactNode;
    children: ReactNode;
}

/**
 * A button that deletes the current entity when clicked.
 *
 * If immediatePersist is true, the binding will trigger persist immediately after the entity is deleted.
 *
 * ## Props {@link DeleteEntityTriggerProps}
 * - children, ?immediatePersist, ?onPersistError, ?onPersistSuccess
 *
 * #### Example
 * ```tsx
 * <DeleteEntityTrigger immediatePersist>
 *     <button>Delete</button>
 * </DeleteEntityTrigger>
 * ```
 */
export declare const DeleteEntityTrigger: ({ immediatePersist, onPersistError, onPersistSuccess, ...props }: DeleteEntityTriggerProps) => JSX_2.Element;

export declare interface DeleteEntityTriggerProps {
    /**
     * If true, binding will trigger persist immediately after the entity is deleted.
     */
    immediatePersist?: boolean;
    /**
     * The button element.
     */
    children: ReactElement;
    /**
     * Callback that is called when the entity is successfully deleted.
     * Ignored if immediatePersist is not true.
     */
    onPersistSuccess?: (result: SuccessfulPersistResult) => void;
    /**
     * Callback that is called when an error occurs during the deletion.
     * Ignored if immediatePersist is not true.
     */
    onPersistError?: (result: ErrorPersistResult) => void;
}

export declare const DimensionRenderer: React_2.NamedExoticComponent<DimensionRendererProps>;

export declare type DimensionRendererProps = {
    dimension: string;
    as: string;
    children: ReactNode;
};

export declare const DirtinessContext: React.Context<boolean>;

/**
 * @group Data binding
 */
export declare const Entity: React.NamedExoticComponent<EntityBaseProps>;

export declare interface EntityBaseProps {
    accessor: EntityAccessor;
    children?: ReactNode;
}

export declare function EntityKeyProvider(props: EntityKeyProviderProps): JSX_2.Element;

export declare interface EntityKeyProviderProps {
    entityKey: string | (() => EntityAccessor);
    children: ReactNode;
}

/**
 * @group Data binding
 */
export declare const EntityList: <ListProps>(props: EntityListProps<ListProps>) => ReactElement;

export declare interface EntityListBaseProps {
    accessor: EntityListAccessor;
    children?: ReactNode;
}

export declare type EntityListProps<ListProps> = EntityListBaseProps & ({} | {
    listComponent: ComponentType<ListProps & EntityListBaseProps>;
    listProps?: ListProps;
});

/**
 * Creates a subtree with list of entities in current data binding context.
 *
 * @example
 * ```
 * <EntityListSubTree entities="Post" />
 * ```
 *
 * @group Data binding
 */
export declare const EntityListSubTree: <ListProps, EntityProps>(props: EntityListSubTreeProps<ListProps, EntityProps>) => ReactElement;

export declare interface EntityListSubTreeAdditionalProps {
    variables?: Environment.ValuesMapWithFactory;
}

export declare type EntityListSubTreeLoaderState = UseEntitySubTreeLoaderState<any>['state'];

export declare type EntityListSubTreeProps<ListProps, EntityProps> = {
    treeRootId?: TreeRootId;
    children?: ReactNode;
} & EntityListSubTreeAdditionalProps & (SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList) & ({} | {
    listComponent: ComponentType<ListProps & EntityListBaseProps>;
    listProps?: ListProps;
});

export declare type EntityProps = EntityBaseProps;

export declare interface EntityProviderProps {
    accessor: EntityAccessor;
    children: ReactNode;
}

/**
 * Creates a single entity subtree in current data binding context.
 *
 * @example
 * ```
 * <EntitySubTree entity="Post(id = $id)" />
 * ```
 *
 * @group Data binding
 */
export declare const EntitySubTree: <EntityProps>(pros: EntitySubTreeProps<EntityProps>) => ReactElement;

export declare type EntitySubTreeAdditionalCreationProps = {} | SetOrderFieldOnCreateOwnProps;

export declare interface EntitySubTreeAdditionalProps {
    variables?: Environment.ValuesMapWithFactory;
}

export declare type EntitySubTreeProps<EntityProps> = {
    treeRootId?: TreeRootId;
    children?: ReactNode;
} & EntitySubTreeAdditionalProps & (SugaredQualifiedSingleEntity | (SugaredUnconstrainedQualifiedSingleEntity & EntitySubTreeAdditionalCreationProps));

/**
 * @group Data binding
 */
export declare function EntityView(props: EntityViewProps): JSX_2.Element;

export declare interface EntityViewProps {
    render: (entity: EntityAccessor) => ReactNode;
    field?: string | SugaredRelativeSingleEntity;
}

export declare interface EnvironmentAwareFunctionComponent<P> {
    (props: PropsWithChildren<P>, environment: Environment): ReactNode;
    displayName?: string | undefined;
}

export declare const EnvironmentContext: React.Context<Environment<Environment.AnyNode | undefined>>;

export declare interface EnvironmentDeltaProvider<Props extends {} = any> {
    generateEnvironment: (props: Props, oldEnvironment: Environment) => Environment;
}

export declare const EnvironmentExtensionProvider: <S, R>(props: EnvironmentWithExtensionProps<S, R>) => ReactNode;

export declare const EnvironmentMiddleware: <T extends unknown[]>(props: EnvironmentMiddlewareProps<T>) => ReactNode;

export declare interface EnvironmentMiddlewareProps<T extends unknown[]> {
    children: ReactNode;
    create: (env: Environment, args: T) => Environment;
    args?: T;
}

export declare interface EnvironmentWithExtensionProps<S, R> {
    children: ReactNode;
    extension: Environment.Extension<S, R>;
    state: S;
}

export declare interface ErrorAccessorTreeState {
    name: 'error';
    environment: Environment;
    error: GraphQlClientError;
}

/**
 * @group Data binding
 */
export declare const Field: <Persisted extends FieldValue = FieldValue>(props: FieldProps<Persisted>) => ReactElement;

export declare interface FieldBasicProps extends SugaredRelativeSingleField {
}

export declare interface FieldProps<Persisted extends FieldValue = FieldValue> extends FieldBasicProps, FieldRuntimeProps<Persisted> {
}

export declare interface FieldRuntimeProps<Persisted extends FieldValue = FieldValue> {
    format?: (value: Persisted | null) => ReactNode;
}

/**
 * Base field view component with no default formatting.
 *
 * @example
 * ```
 * <FieldView
 *   field="startsAt"
 *   render={(accessor) => <>{accessor.value}</>}
 * />
 * ```
 *
 * @group Field Views
 */
export declare const FieldView: FieldViewComponentSignature;

export declare interface FieldViewCommonProps {
    fallbackIfUnpersisted?: ReactNode;
}

export declare type FieldViewComponentSignature = {
    <FV1 extends FieldValue>(props: FieldViewCommonProps & {
        field: string | SugaredRelativeSingleField;
        render: (field1: FieldAccessor<FV1>) => ReactNode;
    }): ReactElement | null;
    <FV1 extends FieldValue>(props: FieldViewCommonProps & {
        fields: [string | SugaredRelativeSingleField];
        render: (field1: FieldAccessor<FV1>) => ReactNode;
    }): ReactElement | null;
    <FV1 extends FieldValue, FV2 extends FieldValue>(props: FieldViewCommonProps & {
        fields: [string | SugaredRelativeSingleField, string | SugaredRelativeSingleField];
        render: (field1: FieldAccessor<FV1>, field2: FieldAccessor<FV2>) => ReactNode;
    }): ReactElement | null;
    <FV1 extends FieldValue, FV2 extends FieldValue, FV3 extends FieldValue>(props: FieldViewCommonProps & {
        fields: [string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField];
        render: (field1: FieldAccessor<FV1>, field2: FieldAccessor<FV2>, field3: FieldAccessor<FV3>) => ReactNode;
    }): ReactElement | null;
    <FV1 extends FieldValue, FV2 extends FieldValue, FV3 extends FieldValue, FV4 extends FieldValue>(props: FieldViewCommonProps & {
        fields: [string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField];
        render: (field1: FieldAccessor<FV1>, field2: FieldAccessor<FV2>, field3: FieldAccessor<FV3>, field4: FieldAccessor<FV4>) => ReactNode;
    }): ReactElement | null;
    <FV1 extends FieldValue, FV2 extends FieldValue, FV3 extends FieldValue, FV4 extends FieldValue, FV5 extends FieldValue>(props: FieldViewCommonProps & {
        fields: [string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField, string | SugaredRelativeSingleField];
        render: (field1: FieldAccessor<FV1>, field2: FieldAccessor<FV2>, field3: FieldAccessor<FV3>, field4: FieldAccessor<FV4>, field5: FieldAccessor<FV5>) => ReactNode;
    }): ReactElement | null;
    (props: FieldViewProps): ReactElement | null;
};

export declare type FieldViewProps = FieldViewCommonProps & ({
    render: (...accessors: FieldAccessor[]) => ReactNode;
    field: string | SugaredRelativeSingleField;
} | {
    render: (...accessors: FieldAccessor[]) => ReactNode;
    fields: Array<string | SugaredRelativeSingleField>;
});

/**
 * @group Data binding
 */
export declare const HasMany: <ListProps, EntityProps>(props: HasManyProps<ListProps, EntityProps>) => ReactElement;

export declare type HasManyProps<ListProps = never, EntityProps = never> = SugaredRelativeEntityList & {
    children?: ReactNode;
    variables?: Environment.ValuesMapWithFactory;
} & ({} | {
    listComponent: ComponentType<ListProps & EntityListBaseProps>;
    listProps?: ListProps;
});

/**
 * @group Data binding
 */
export declare const HasOne: <EntityProps extends {}>(props: HasOneProps<EntityProps>) => ReactElement;

export declare type HasOneProps<EntityProps = never> = SugaredRelativeSingleEntity & {
    children?: ReactNode;
    variables?: Environment.ValuesMapWithFactory;
};

/**
 * @group Logic Components
 */
export declare const If: React.NamedExoticComponent<IfProps>;

export declare interface IfCallbackProps {
    condition: (accessor: EntityAccessor) => boolean;
    children?: ReactNode;
    then?: ReactNode;
    else?: ReactNode;
}

export declare interface IfFilterProps {
    condition: string | Filter;
    children?: ReactNode;
    then?: ReactNode;
    else?: ReactNode;
}

export declare type IfProps = IfFilterProps | IfCallbackProps;

export declare interface InitializedAccessorTreeState {
    name: 'initialized';
    environment: Environment;
    data: TreeRootAccessor<ReactNode>;
}

export declare interface InitializingAccessorTreeState {
    name: 'initializing';
    environment: Environment;
}

export declare type LabelMiddleware = (label: ReactNode, environment: Environment) => ReactNode;

export declare const LabelMiddlewareContext: React.Context<LabelMiddleware>;

export declare const LabelMiddlewareProvider: ({ value, children }: {
    value: LabelMiddleware;
    children: ReactNode;
}) => JSX_2.Element;

export declare interface LeafMarkerProvider<Props extends {} = any> {
    generateLeafMarker: (props: Props, environment: Environment) => FieldMarker | HasOneRelationMarker | EntityFieldMarkersContainer;
}

export declare type MarkerProvider<Props extends {} = any, NonStaticPropNames extends keyof Props = never> = Partial<CompleteMarkerProvider<Props, NonStaticPropNames>>;

export declare class MarkerTreeGenerator {
    private sourceTree;
    private environment;
    constructor(sourceTree: ReactNode, environment?: Environment);
    generate(): MarkerTreeRoot;
    private generatePlaceholdersByAliases;
}

export declare const MutationStateContext: React.Context<boolean>;

/**
 * @group Data binding
 */
export declare const ParentEntity: React.NamedExoticComponent<ParentEntityProps>;

export declare interface ParentEntityProps extends SugaredParentEntityParameters {
    children?: ReactNode;
}

/**
 * Triggers persist when the specified field changes.
 * This only works for scalar fields, for relations, see {@link PersistOnHasOneChange}.
 *
 * ## Props {@link PersistOnFieldChangeProps}
 * - field, ?onPersistError, ?onPersistSuccess
 *
 * #### Example
 * ```tsx
 * <PersistOnFieldChange field="name" />
 * ```
 */
export declare const PersistOnFieldChange: React.NamedExoticComponent<PersistOnFieldChangeProps>;

export declare type PersistOnFieldChangeProps = {
    /**
     * The field that should trigger persist when changed.
     */
    field: SugaredRelativeSingleField['field'];
    /**
     * Callback that is called when persist is successful.
     */
    onPersistSuccess?: (result: SuccessfulPersistResult) => void;
    /**
     * Callback that is called when an error occurs during persist.
     */
    onPersistError?: (result: ErrorPersistResult) => void;
};

/**
 * Triggers persist when the specified relation field changes.
 * This only works for has-one relation fields, for scalar fields, see {@link PersistOnFieldChange}.
 *
 * ## Props {@link PersistOnHasOneChangeProps}
 * - field, ?onPersistError, ?onPersistSuccess
 *
 * #### Example
 * ```tsx
 * <PersistOnHasOneChange field="author" />
 * ```
 */
export declare const PersistOnHasOneChange: React.NamedExoticComponent<PersistOnHasOneChangeProps>;

export declare type PersistOnHasOneChangeProps = {
    /**
     * The relation field that should trigger persist when changed.
     */
    field: SugaredRelativeSingleEntity['field'];
    /**
     * Callback that is called when persist is successful.
     */
    onPersistSuccess?: (result: SuccessfulPersistResult) => void;
    /**
     * Callback that is called when an error occurs during persist.
     */
    onPersistError?: (result: ErrorPersistResult) => void;
};

/**
 * Triggers persist when the specified hotkey is pressed.
 *
 * ## Props {@link PersistOnKeyProps}
 * - ?isHotkey, ?onPersistError, ?onPersistSuccess
 *
 * #### Example
 * ```tsx
 * <PersistOnKey />
 * ```
 */
export declare const PersistOnKey: ({ onPersistSuccess, onPersistError, isHotkey, }: PersistOnKeyProps) => null;

export declare type PersistOnKeyProps = {
    /**
     * Callback that is called when persist is successful.
     */
    onPersistSuccess?: (result: SuccessfulPersistResult) => void;
    /**
     * Callback that is called when an error occurs during persist.
     */
    onPersistError?: (result: ErrorPersistResult) => void;
    /**
     * Optional function that decides whether a given KeyboardEvent
     * should trigger the persist action.
     */
    isHotkey?: (event: KeyboardEvent) => boolean;
};

/**
 * A button that triggers persist when clicked.
 *
 * ## Props {@link PersistTriggerProps}
 * - children, ?onPersistError, ?onPersistSuccess
 *
 * #### Example
 * ```tsx
 * <PersistTrigger>
 *     <button>Save</button>
 * </PersistTrigger>
 * ```
 */
export declare const PersistTrigger: ({ onPersistError, onPersistSuccess, ...props }: PersistTriggerProps) => JSX_2.Element;

export declare interface PersistTriggerAttributes {
    ['data-dirty']?: '';
    ['data-loading']?: '';
}

export declare interface PersistTriggerProps {
    /**
     * The button element.
     */
    children: ReactElement;
    /**
     * Callback that is called when persist is successful.
     */
    onPersistSuccess?: (result: SuccessfulPersistResult) => void;
    onPersistError?: (result: ErrorPersistResult) => void;
}

export declare const RecursionTerminator: React.NamedExoticComponent<RecursionTerminatorProps>;

export declare const recursionTerminatorEnvironmentExtension: Environment.Extension<RecursionTerminatorOptions, RecursionTerminatorOptions | undefined>;

export declare interface RecursionTerminatorOptions {
    shouldTerminate?: (args: {
        node: Environment.AnyNode;
        field: string;
        environment: Environment;
    }) => boolean | undefined;
}

export declare const RecursionTerminatorPortal: React.NamedExoticComponent<RecursionTerminatorProps>;

export declare interface RecursionTerminatorProps {
    field: {
        kind: 'hasOne';
        field: SugaredRelativeSingleEntity['field'];
    } | {
        kind: 'hasMany';
        field: SugaredRelativeEntityList['field'];
    };
    children: ReactNode;
}

export declare const repairEntitiesOrder: (sortableByField: RelativeSingleField, sortedEntities: EntityAccessor[]) => void;

export declare const SetOrderFieldOnCreate: React.NamedExoticComponent<SetOrderFieldOnCreateProps>;

export declare interface SetOrderFieldOnCreateOwnProps {
    orderField: SugaredRelativeSingleField | string;
    newOrderFieldValue?: number;
}

export declare interface SetOrderFieldOnCreateProps extends SetOrderFieldOnCreateOwnProps, Pick<SugaredUnconstrainedQualifiedSingleEntity, 'entity'> {
}

export declare interface SortedEntities {
    entities: EntityAccessor[];
    prependNew: (initialize?: EntityAccessor.BatchUpdatesHandler) => void;
    appendNew: (initialize?: EntityAccessor.BatchUpdatesHandler) => void;
    addNewAtIndex: (index: number | undefined, preprocess?: EntityAccessor.BatchUpdatesHandler) => void;
    moveEntity: (oldIndex: number, newIndex: number) => void;
}

export declare const sortEntities: (entities: EntityAccessor[], sortByField: RelativeSingleField | undefined) => EntityAccessor[];

/**
 * @group Data binding
 */
export declare const StaticRender: React.NamedExoticComponent<StaticRenderProps>;

export declare interface StaticRenderProps {
    children?: ReactNode;
}

export declare interface StaticRenderProvider<Props extends {} = any, NonStaticPropNames extends keyof Props = never> {
    staticRender: (props: StaticRenderProviderProps<Props, NonStaticPropNames>, environment: Environment) => ReactNode;
}

export declare type StaticRenderProviderProps<Props extends {} = any, NonStaticPropNames extends keyof Props = never> = [
NonStaticPropNames
] extends [never] ? Props : Omit<Props, NonStaticPropNames>;

/**
 * @group Data binding
 */
export declare const SugaredField: <Persisted extends FieldValue = FieldValue>(props: SugaredFieldProps<Persisted>) => ReactElement;

export declare interface SugaredFieldProps<Persisted extends FieldValue = FieldValue> extends Omit<FieldProps<Persisted>, 'field'> {
    field: string | SugaredRelativeSingleField;
}

export declare function TreeRootIdProvider(props: TreeRootIdProviderProps): JSX_2.Element;

export declare interface TreeRootIdProviderProps {
    treeRootId: TreeRootId | undefined;
    children: ReactNode;
}

export declare const useAccessorTreeState: () => AccessorTreeState;

/**
 * It is VERY IMPORTANT for the parameter to be referentially stable!
 */
export declare const useAccessorUpdateSubscription: <Accessor extends {
    addEventListener: (event: {
        type: "update";
    }, cb: (accessor: Accessor) => void) => () => void;
}>(getAccessor: () => Accessor) => [Accessor, {
    update: () => void;
}];

export declare const useBindingOperations: () => BindingOperations<ReactNode>;

export declare const useDataBinding: ({ children, refreshOnPersist, skipStateUpdateAfterPersist, }: {
    children?: ReactNode;
    refreshOnPersist?: boolean;
    skipStateUpdateAfterPersist?: boolean;
}) => AccessorTreeState;

export declare const useDataBindingEvent: <Type extends keyof DataBindingEventListenerMap>(event: Type, listener: DataBindingEventListenerMap[Type]) => void;

/**
 * Derived fields are meant for cases when the user is expected to primarily edit the `sourceField` whose optionally
 * transformed value is then copied to the `derivedField`. This happens after each update until either the `derivedField`
 * is touched or until it is persisted at which point the tie between the fields is automatically severed.
 * @deprecated This is fundamentally wrong and shouldn't be used for now.
 */
export declare const useDerivedField: <SourceValue extends FieldValue = FieldValue>(sourceField: string | SugaredRelativeSingleField, derivedField: string | SugaredRelativeSingleField, transform?: (sourceValue: SourceValue | null) => SourceValue | null, agent?: string) => void;

/**
 * @deprecated Use useEntityList instead.
 */
export declare function useDesugaredRelativeEntityList(sugaredRelativeEntityList: string | SugaredRelativeEntityList): RelativeEntityList;

/**
 * @deprecated Use useEntityList instead.
 */
export declare function useDesugaredRelativeEntityList(sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined): RelativeEntityList | undefined;

/**
 * @deprecated Use useEntity instead.
 */
export declare function useDesugaredRelativeSingleEntity(sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity): RelativeSingleEntity;

/**
 * @deprecated Use useEntity instead.
 */
export declare function useDesugaredRelativeSingleEntity(sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined): RelativeSingleEntity | undefined;

/**
 * @deprecated Use useField instead.
 */
export declare function useDesugaredRelativeSingleField(sugaredRelativeSingleField: string | SugaredRelativeSingleField): RelativeSingleField;

/**
 * @deprecated Use useField instead.
 */
export declare function useDesugaredRelativeSingleField(sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined): RelativeSingleField | undefined;

export declare const useDirtinessState: () => boolean;

export declare function useEntity(): EntityAccessor;

export declare function useEntity(sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity): EntityAccessor;

export declare function useEntity(sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity | undefined): EntityAccessor | undefined;

export declare const useEntityBeforePersist: (listener: EntityAccessor.EntityEventListenerMap["beforePersist"]) => void;

export declare const useEntityBeforeUpdate: (listener: EntityAccessor.EntityEventListenerMap["beforeUpdate"]) => void;

export declare function useEntityEvent(type: 'beforePersist', listener: EntityAccessor.EntityEventListenerMap['beforePersist']): void;

export declare function useEntityEvent(type: 'beforeUpdate', listener: EntityAccessor.EntityEventListenerMap['beforeUpdate']): void;

export declare function useEntityEvent(type: 'connectionUpdate', hasOneField: FieldName, listener: EntityAccessor.EntityEventListenerMap['connectionUpdate']): void;

export declare function useEntityEvent(type: 'persistError', listener: EntityAccessor.EntityEventListenerMap['persistError']): void;

export declare function useEntityEvent(type: 'persistSuccess', listener: EntityAccessor.EntityEventListenerMap['persistSuccess']): void;

export declare function useEntityEvent(type: 'update', listener: EntityAccessor.EntityEventListenerMap['update']): void;

export declare const useEntityKey: () => string | (() => EntityAccessor);

export declare function useEntityList(sugaredRelativeEntityList: string | SugaredRelativeEntityList): EntityListAccessor;

export declare function useEntityList(sugaredRelativeEntityList: string | SugaredRelativeEntityList | undefined): EntityListAccessor | undefined;

export declare const useEntityListSubTree: (qualifiedEntityList: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList, ...treeId: [TreeRootId | undefined] | []) => EntityListAccessor;

export declare const useEntityListSubTreeLoader: <State>(entities: SugaredQualifiedEntityList | undefined, children: ReactNode, state?: State) => [UseEntityListSubTreeLoaderState<State>, UseEntityListSubTreeLoaderStateMethods];

export declare type UseEntityListSubTreeLoaderState<State> = UseEntityListSubTreeLoaderStateInitial | UseEntityListSubTreeLoaderStateLoading | UseEntityListSubTreeLoaderStateRefreshing<State> | UseEntityListSubTreeLoaderStateLoaded<State> | UseEntityListSubTreeLoaderStateFailed;

export declare type UseEntityListSubTreeLoaderStateFailed = {
    state: 'failed';
    error: unknown;
    entities: undefined;
    treeRootId: undefined;
    customState: undefined;
    isLoading: false;
};

export declare type UseEntityListSubTreeLoaderStateInitial = {
    state: 'initial';
    entities: undefined;
    treeRootId: undefined;
    customState: undefined;
    isLoading: false;
};

export declare type UseEntityListSubTreeLoaderStateLoaded<State> = {
    state: 'loaded';
    entities: SugaredQualifiedEntityList;
    treeRootId: TreeRootId | undefined;
    customState: State;
    isLoading: false;
};

export declare type UseEntityListSubTreeLoaderStateLoading = {
    state: 'loading';
    entities: undefined;
    treeRootId: undefined;
    customState: undefined;
    isLoading: true;
};

export declare type UseEntityListSubTreeLoaderStateMethods = {
    reload: () => void;
};

export declare type UseEntityListSubTreeLoaderStateRefreshing<State> = {
    state: 'refreshing';
    entities: SugaredQualifiedEntityList;
    treeRootId: TreeRootId | undefined;
    customState: State;
    isLoading: true;
};

export declare function useEntityListSubTreeParameters(alias: Alias): Alias;

export declare function useEntityListSubTreeParameters(qualifiedEntityList: SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList): SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList;

export declare function useEntityListSubTreeParameters(qualifiedEntityListOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList): Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList;

export declare const useEntityPersistError: (listener: EntityAccessor.EntityEventListenerMap["persistError"]) => void;

export declare const useEntityPersistSuccess: (listener: EntityAccessor.EntityEventListenerMap["persistSuccess"]) => void;

export declare const useEntitySubTree: (qualifiedSingleEntity: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity, ...treeId: [TreeRootId | undefined] | []) => EntityAccessor;

export declare const useEntitySubTreeLoader: <State>(entity: SugaredQualifiedSingleEntity | undefined, children: ReactNode, state?: State) => [UseEntitySubTreeLoaderState<State>, UseEntitySubTreeLoaderStateMethods];

export declare type UseEntitySubTreeLoaderState<State> = UseEntitySubTreeLoaderStateInitial | UseEntitySubTreeLoaderStateLoading | UseEntitySubTreeLoaderStateRefreshing<State> | UseEntitySubTreeLoaderStateLoaded<State> | UseEntitySubTreeLoaderStateFailed;

export declare type UseEntitySubTreeLoaderStateFailed = {
    state: 'failed';
    error: unknown;
    entity: undefined;
    treeRootId: undefined;
    customState: undefined;
    isLoading: false;
};

export declare type UseEntitySubTreeLoaderStateInitial = {
    state: 'initial';
    entity: undefined;
    treeRootId: undefined;
    customState: undefined;
    isLoading: false;
};

export declare type UseEntitySubTreeLoaderStateLoaded<State> = {
    state: 'loaded';
    entity: SugaredQualifiedSingleEntity;
    treeRootId: TreeRootId | undefined;
    customState: State;
    isLoading: false;
};

export declare type UseEntitySubTreeLoaderStateLoading = {
    state: 'loading';
    entity: undefined;
    treeRootId: undefined;
    customState: undefined;
    isLoading: true;
};

export declare type UseEntitySubTreeLoaderStateMethods = {
    reload: () => void;
};

export declare type UseEntitySubTreeLoaderStateRefreshing<State> = {
    state: 'refreshing';
    entity: SugaredQualifiedSingleEntity;
    treeRootId: TreeRootId | undefined;
    customState: State;
    isLoading: true;
};

export declare function useEntitySubTreeParameters(alias: Alias): Alias;

export declare function useEntitySubTreeParameters(qualifiedEntity: SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity): SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity;

export declare function useEntitySubTreeParameters(qualifiedSingleEntityOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity): Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity;

export declare const useEnvironment: () => Environment;

export declare const useExtendTree: () => (newFragment: ReactNode, options?: Omit<ExtendTreeOptions, "signal">) => Promise<TreeRootId | undefined>;

export declare function useField<Value extends FieldValue = FieldValue>(sugaredRelativeSingleField: string | SugaredRelativeSingleField): FieldAccessor<Value>;

export declare function useField<Value extends FieldValue = FieldValue>(sugaredRelativeSingleField: string | SugaredRelativeSingleField | undefined): FieldAccessor<Value> | undefined;

export declare const useGetEntityByKey: () => GetEntityByKey;

export declare const useGetEntityListSubTree: () => ((parametersOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList, ...treeId: [TreeRootId | undefined] | []) => EntityListAccessor);

export declare const useGetEntitySubTree: () => ((parametersOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity, ...treeId: [TreeRootId | undefined] | []) => EntityAccessor);

export declare const useHasEntity: () => boolean;

export declare const useLabelMiddleware: () => (it: ReactNode) => ReactNode;

export declare const useMutationState: () => boolean;

export declare const useOnConnectionUpdate: (fieldName: FieldName, listener: EntityAccessor.EntityEventListenerMap["connectionUpdate"]) => void;

export declare const usePersist: () => Persist;

export declare const useTreeRootId: () => TreeRootId | undefined;

export declare const Variable: React.MemoExoticComponent<({ name, format }: VariableProps) => ReactElement>;

export declare interface VariableProps {
    name: Environment.Name;
    format?: (value: ReactNode) => ReactNode;
}


export * from "@contember/binding";

export { }
