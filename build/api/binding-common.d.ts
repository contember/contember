import { ContentQueryBuilder } from '@contember/client-content';
import { EmbeddedActionsParser } from 'chevrotain';
import { v4 as generateUuid } from 'uuid';
import type { GraphQlClient } from '@contember/client';
import type { GraphQlClientRequestOptions } from '@contember/client';
import { Input } from '@contember/client';
import { MutationResult } from '@contember/client';
import type { Result } from '@contember/client';
import { TokenType } from 'chevrotain';
import { TransactionResult } from '@contember/client';

export declare type Alias = string;

declare type AnyFunction = (...args: any[]) => any;

export declare function assertNever(_: never): never;

export declare interface AsyncBatchUpdatesOptions extends BatchUpdatesOptions {
    contentClient: GraphQlClient;
    systemClient: GraphQlClient;
    tenantClient: GraphQlClient;
}

export declare interface BaseRelation {
    __typename: '_Relation';
    name: FieldName;
    nullable: boolean | null;
    onDelete: 'restrict' | 'cascade' | 'setNull' | null;
    orderBy: SchemaRelationOrderBy[] | null;
    orphanRemoval: boolean | null;
    targetEntity: EntityName;
    type: 'OneHasOne' | 'OneHasMany' | 'ManyHasOne' | 'ManyHasMany';
}

export declare type BatchDeferredUpdates = (performUpdates: (bindingOperations: BatchUpdatesOptions) => void) => void;

export declare interface BatchUpdatesOptions {
    getEntityByKey: GetEntityByKey;
    getEntityListSubTree: GetEntityListSubTree;
    getEntitySubTree: GetEntitySubTree;
}

export declare class BindingError extends Error {
}

export declare interface BindingOperations<Node> extends AsyncBatchUpdatesOptions {
    addEventListener: <Type extends keyof DataBindingEventListenerMap>(event: Type, listener: DataBindingEventListenerMap[Type]) => () => void;
    extendTree: ExtendTree<Node>;
    fetchData: FetchData<Node>;
    batchDeferredUpdates: BatchDeferredUpdates;
    persist: Persist;
}

export declare class ClientGeneratedUuid implements RuntimeIdSpec {
    readonly value: string;
    get existsOnServer(): false;
    constructor(value: string);
    get uniqueValue(): UniqueEntityId;
}

export declare const createQueryBuilder: (schema: Schema) => ContentQueryBuilder;

export declare type DataBindingEventListenerMap = {
    persistSuccess: (result: SuccessfulPersistResult) => void | Promise<void>;
    persistError: (result: ErrorPersistResult) => void | Promise<void>;
};

export declare const DataBindingExtendAborted: unique symbol;

export declare type DataBindingTransactionResult = TransactionResult<Record<string, MutationResult<ReceivedEntityData>>>;

export declare interface EntityAccessor extends Errorable {
    readonly __type: 'EntityAccessor';
    /**
     * The key is a unique identifier of the entity. It is not the id of the entity.
     */
    readonly key?: EntityRealmKey;
    readonly name: EntityName;
    readonly hasUnpersistedChanges: boolean;
    readonly errors: ErrorAccessor | undefined;
    readonly environment: Environment;
    readonly getAccessor: EntityAccessor.GetEntityAccessor;
    readonly idOnServer: EntityId | undefined;
    readonly id: EntityId;
    readonly existsOnServer: boolean;
    addError: ErrorAccessor.AddError;
    addEventListener: EntityAccessor.AddEventListener;
    batchUpdates(performUpdates: EntityAccessor.BatchUpdatesHandler): void;
    connectEntityAtField(field: SugaredRelativeSingleEntity | string, entityToConnect: EntityAccessor): void;
    disconnectEntityAtField(field: SugaredRelativeSingleEntity | string, initializeReplacement?: EntityAccessor.BatchUpdatesHandler): void;
    deleteEntity(): void;
    updateValues(fieldValuePairs: EntityAccessor.FieldValuePairs): void;
    /**
     * Please keep in mind that this method signature is literally impossible to implement safely. The generic parameter
     * is really just a way to succinctly write a type cast. Nothing more, really.
     */
    getField<Value extends FieldValue = FieldValue>(field: SugaredRelativeSingleField | string | RelativeSingleField): FieldAccessor<Value>;
    getEntity(entity: SugaredRelativeSingleEntity | string | RelativeSingleEntity): EntityAccessor;
    getEntityList(entityList: SugaredRelativeEntityList | string | RelativeEntityList): EntityListAccessor;
    getParent(): EntityAccessor | EntityListAccessor | undefined;
    getMarker(): HasManyRelationMarker | HasOneRelationMarker | EntitySubTreeMarker | EntityListSubTreeMarker;
    getFieldMeta(field: string): {
        readable?: boolean;
        updatable?: boolean;
    };
}

export declare namespace EntityAccessor {
    export interface FieldDatum {
        getAccessor(): NestedAccessor;
    }
    export type NestedAccessor = EntityAccessor | EntityListAccessor | FieldAccessor<any>;
    export type FieldValuePairs = {
        [field: string]: FieldValue;
    } | Iterable<[SugaredRelativeSingleField | string, FieldValue]>;
    export type FieldData = Map<FieldName, FieldDatum>;
    export type GetEntityAccessor = () => EntityAccessor;
    export type BatchUpdatesHandler = (getAccessor: GetEntityAccessor, options: BatchUpdatesOptions) => void;
    export type UpdateListener = (accessor: EntityAccessor) => void;
    export type BeforePersistHandler = (getAccessor: GetEntityAccessor, options: AsyncBatchUpdatesOptions) => void | BeforePersistHandler | Promise<void | BeforePersistHandler>;
    export type PersistErrorHandler = (getAccessor: GetEntityAccessor, options: PersistErrorOptions) => void | Promise<void>;
    export type PersistSuccessHandler = (getAccessor: GetEntityAccessor, options: PersistSuccessOptions) => void | PersistSuccessHandler | Promise<void | PersistSuccessHandler>;
    export type RuntimeEntityEventListenerMap = {
        beforePersist: BeforePersistHandler;
        beforeUpdate: BatchUpdatesHandler;
        connectionUpdate: UpdateListener;
        persistError: PersistErrorHandler;
        persistSuccess: PersistSuccessHandler;
        update: UpdateListener;
    };
    export type EntityEventListenerMap = RuntimeEntityEventListenerMap & {
        initialize: BatchUpdatesHandler;
    };
    export type EntityEventType = keyof EntityEventListenerMap;
    export type AddEventListener = <Type extends keyof EntityAccessor.RuntimeEntityEventListenerMap>(event: {
        type: Type;
        key?: string;
    }, listener: EntityAccessor.EntityEventListenerMap[Type]) => () => void;
}

export declare const EntityCreationParametersDefaults: {
    readonly isNonbearing: false;
};

export declare type EntityEventListenerStore = EventListenersStore<EntityAccessor.EntityEventListenerMap>;

export declare type EntityFieldMarker = FieldMarker | HasOneRelationMarker | HasManyRelationMarker;

export declare type EntityFieldMarkers = ReadonlyMap<PlaceholderName, EntityFieldMarker>;

export declare class EntityFieldMarkersContainer {
    readonly hasAtLeastOneBearingField: boolean;
    readonly markers: EntityFieldMarkers;
    readonly placeholders: EntityFieldPlaceholders;
    constructor(hasAtLeastOneBearingField: boolean, markers: EntityFieldMarkers, // Indexed by placeholder names
    placeholders: EntityFieldPlaceholders);
}

export declare type EntityFieldPlaceholders = ReadonlyMap<FieldName, PlaceholderName | Set<PlaceholderName>>;

export declare class EntityFieldsWithHoistablesMarker {
    readonly fields: EntityFieldMarkersContainer;
    readonly subTrees: SubTreeMarkers | undefined;
    readonly parentReference: ParentEntityParameters | undefined;
    constructor(fields: EntityFieldMarkersContainer, subTrees: SubTreeMarkers | undefined, parentReference: ParentEntityParameters | undefined);
}

export declare type EntityId = string | number;

export declare interface EntityListAccessor extends Errorable {
    readonly __type: 'EntityListAccessor';
    readonly name: EntityName;
    readonly hasUnpersistedChanges: boolean;
    readonly errors: ErrorAccessor | undefined;
    readonly environment: Environment;
    readonly getAccessor: EntityListAccessor.GetEntityListAccessor;
    /**
     * Returns all entity keys that are on the list.
     * **KEYS ARE NOT IDS!**
     * @see EntityAccessor.key
     */
    keys(): IterableIterator<EntityRealmKey>;
    ids(): IterableIterator<EntityId>;
    /**
     * This will only contain the ids that the server knows about. Not necessarily the ids that have been added on
     * the list since the last server query.
     */
    idsPersistedOnServer: Set<EntityId>;
    [Symbol.iterator](): IterableIterator<EntityAccessor>;
    hasEntityId(id: EntityId): boolean;
    isEmpty(): boolean;
    length: number;
    deleteAll(): void;
    disconnectAll(): void;
    addError(error: ErrorAccessor.Error | string): () => void;
    addEventListener: EntityListAccessor.AddEventListener;
    addChildEventListener: EntityListAccessor.AddChildEventListener;
    batchUpdates(performUpdates: EntityListAccessor.BatchUpdatesHandler): void;
    connectEntity(entityToConnect: EntityAccessor): void;
    createNewEntity(initialize?: EntityAccessor.BatchUpdatesHandler): RuntimeId;
    disconnectEntity(childEntity: EntityAccessor, options?: {
        noPersist?: boolean;
    }): void;
    getChildEntityById(id: EntityId): EntityAccessor;
    getParent(): EntityAccessor | undefined;
    getMarker(): EntityListSubTreeMarker | HasManyRelationMarker;
}

export declare namespace EntityListAccessor {
    export type GetEntityListAccessor = () => EntityListAccessor;
    export type BatchUpdatesHandler = (getAccessor: GetEntityListAccessor, options: BatchUpdatesOptions) => void;
    export type UpdateListener = (accessor: EntityListAccessor) => void;
    export type BeforePersistHandler = (getAccessor: GetEntityListAccessor, options: AsyncBatchUpdatesOptions) => void | Promise<void | BeforePersistHandler>;
    export type PersistErrorHandler = (getAccessor: GetEntityListAccessor, options: PersistErrorOptions) => void | Promise<void>;
    export type PersistSuccessHandler = (getAccessor: GetEntityListAccessor, options: PersistSuccessOptions) => void | Promise<void | PersistSuccessHandler>;
    export type ChildEventListenerMap = {
        childBeforeUpdate: EntityAccessor.BatchUpdatesHandler;
        childInitialize: EntityAccessor.BatchUpdatesHandler;
        childUpdate: EntityAccessor.UpdateListener;
    };
    export type RuntimeEntityListEventListenerMap = {
        beforePersist: BeforePersistHandler;
        beforeUpdate: BatchUpdatesHandler;
        persistError: PersistErrorHandler;
        persistSuccess: PersistSuccessHandler;
        update: UpdateListener;
    };
    export type EntityListEventListenerMap = RuntimeEntityListEventListenerMap & {
        initialize: BatchUpdatesHandler;
    };
    export type EntityListEventType = keyof EntityListEventListenerMap;
    export type AddEventListener = <Type extends keyof EntityListAccessor.RuntimeEntityListEventListenerMap>(event: {
        type: Type;
        key?: string;
    }, listener: EntityListAccessor.EntityListEventListenerMap[Type]) => () => void;
    export type AddChildEventListener = <Type extends keyof EntityAccessor.EntityEventListenerMap>(event: {
        type: Type;
        key?: string;
    }, listener: EntityAccessor.EntityEventListenerMap[Type]) => () => void;
}

export declare type EntityListEventListenerStore = EventListenersStore<EntityListAccessor.EntityListEventListenerMap>;

export declare const EntityListPreferencesDefaults: {
    initialEntityCount: number;
};

export declare class EntityListSubTreeMarker {
    readonly parameters: QualifiedEntityList | UnconstrainedQualifiedEntityList;
    readonly fields: EntityFieldMarkersContainer;
    readonly environment: Environment;
    readonly placeholderName: string;
    constructor(parameters: QualifiedEntityList | UnconstrainedQualifiedEntityList, fields: EntityFieldMarkersContainer, environment: Environment);
    get entityName(): string;
}

export declare type EntityName = string;

export declare type EntityRealmKey = string;

export declare class EntitySubTreeMarker {
    readonly parameters: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity;
    readonly fields: EntityFieldMarkersContainer;
    readonly environment: Environment;
    readonly placeholderName: string;
    constructor(parameters: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity, fields: EntityFieldMarkersContainer, environment: Environment);
    get entityName(): string;
}

export declare class Environment<Node extends Environment.AnyNode | undefined = Environment.AnyNode | undefined> {
    private readonly options;
    private constructor();
    static create(): Environment<Environment.AnyNode | undefined>;
    getSubTree(): Environment.SubTreeNode;
    getSubTreeNode(): Node & Environment.AnyNode;
    withSubTree<Node extends Environment.SubTreeNode>(SubTree: Node): Environment<Node>;
    withSubTreeChild<Node extends Environment.InnerNode>(node: Node): Environment<Node>;
    hasVariable(key: string): boolean;
    getVariable<V extends Environment.Value = Environment.Value>(key: string): V;
    getVariableOrElse<F, V extends Environment.Value = Environment.Value>(key: string, fallback: F): V | F;
    withVariables(variables: Environment.ValuesMapWithFactory | undefined): Environment;
    getAllVariables(): Environment.CustomVariables;
    hasParameter(key: string): boolean;
    getParameter<F>(key: string): string | number;
    getParameterOrElse<F>(key: string, fallback: F): string | number | F;
    getAllParameters(): Environment.Parameters;
    withParameters(parameters: Environment.Parameters): Environment;
    hasDimension(dimensionName: string): boolean;
    getDimension<F>(dimensionName: string): string[];
    getDimensionOrElse<F>(dimensionName: string, fallback: F): string[] | F;
    getAllDimensions(): Environment.SelectedDimensions;
    withDimensions(dimensions: Environment.SelectedDimensions): Environment;
    hasSchema(): boolean;
    getSchema(): Schema;
    withSchema(schema: Schema): Environment;
    getParent(): Environment;
    withExtension<S, R>(extension: Environment.Extension<S, R>, state: S): Environment;
    getExtension<S, R>(extension: Environment.Extension<S, R>): R;
    merge(other: Environment): Environment;
}

export declare namespace Environment {
    export type Name = string;
    export type Value = unknown;
    export type ResolvedValue = Value;
    export interface Options<Node extends AnyNode | undefined> {
        node?: Node;
        schema?: Schema;
        dimensions: SelectedDimensions;
        parameters: Parameters;
        variables: CustomVariables;
        parent?: Environment;
        extensions: Map<Extension<unknown, unknown>, unknown>;
    }
    export type SubTreeNode = SubTreeEntityNode | SubTreeEntityListNode;
    export type InnerNode = EntityNode | EntityListNode | ColumnNode;
    export type AnyNode = SubTreeNode | InnerNode;
    export interface SubTreeEntityNode {
        type: 'subtree-entity';
        entity: SchemaEntity;
        expectedCardinality: 'zero' | 'one' | 'zero-or-one';
        filter: Filter;
    }
    export interface SubTreeEntityListNode {
        type: 'subtree-entity-list';
        entity: SchemaEntity;
        expectedCardinality: 'zero-to-many' | 'zero';
        filter: Filter;
    }
    export interface EntityNode {
        type: 'entity';
        entity: SchemaEntity;
        field: SchemaRelation;
    }
    export interface EntityListNode {
        type: 'entity-list';
        entity: SchemaEntity;
        field: SchemaRelation;
    }
    export interface ColumnNode {
        type: 'column';
        entity: SchemaEntity;
        field: SchemaColumn;
    }
    export interface SelectedDimensions {
        [key: string]: string[];
    }
    export type Parameters = {
        [K in string]?: string | number;
    };
    export interface CustomVariables {
        [key: string]: Value;
    }
    export interface ValuesMapWithFactory {
        [key: string]: ((environment: Environment) => Value) | Value;
    }
    export type Extension<State, Result> = {
        create: (state: State | undefined, environment: Environment) => Result;
    };
    const createExtension: <S, R>(create: Extension<S, R>["create"], otherMethods?: Omit<Extension<S, R>, "create">) => Extension<S, R>;
}

export declare interface Errorable {
    errors: ErrorAccessor | undefined;
}

export declare interface ErrorAccessor {
    readonly errors: ErrorAccessor.Error[];
}

export declare namespace ErrorAccessor {
    export type ErrorId = number;
    export type Error = ExecutionError | ValidationError;
    export type ErrorsById = Map<ErrorId, Error>;
    export type ClearError = () => void;
    export type AddError = (error: ErrorAccessor.Error | string) => ClearError;
    export type ExecutionErrors = ExecutionError[];
    export interface ExecutionError {
        type: 'execution';
        code: Result.ExecutionErrorType;
        developerMessage: string | null;
    }
    export type ValidationErrors = ValidationError[];
    export interface ValidationError {
        type: 'validation';
        code: WellKnownErrorCode | string | undefined;
        message: string;
    }
    export type WellKnownErrorCode = 'fieldRequired';
    const normalizeError: (error: Error | string) => Error;
}

export declare interface ErrorAccessorHolder {
    readonly errors: ErrorAccessor | undefined;
}

export declare type ErrorPersistResult = InvalidInputPersistResult | InvalidResponseResult;

export declare class EventListenersStore<Events extends GenericEventsMap> {
    private readonly parentStoreGetter?;
    private listeners?;
    constructor(parentStoreGetter?: (() => EventListenersStore<Events> | undefined) | undefined, listeners?: Map<string, Set<Events[any]>> | undefined);
    set<Type extends keyof Events>(event: {
        type: Type;
        key?: string;
    }, listeners: Set<Events[Type]>): void;
    delete<Type extends keyof Events>(event: {
        type: Type;
        key?: string;
    }): void;
    deleteByType<Type extends keyof Events>(type: Type): void;
    get<Type extends keyof Events>(event: {
        type: Type;
        key?: string;
    }): Set<Events[Type]> | undefined;
    invoke<Type extends keyof Events>(event: {
        type: Type;
        key?: string;
    }, ...args: Parameters<Events[Type]>): void;
    add<Type extends keyof Events>(event: {
        type: Type;
        key?: string;
    }, handler: Events[Type]): () => void;
    clone(): EventListenersStore<Events>;
    append(other: EventListenersStore<Events>): void;
    private formatMapEntryKey;
    private addInternal;
}

export declare type ExpectedEntityCount = 'upToOne' | 'possiblyMany';

export declare type ExpectedQualifiedEntityMutation = 'none' | 'anyMutation';

export declare type ExpectedRelationMutation = 'none' | 'createOrDelete' | 'connectOrDisconnect' | 'anyMutation';

export declare type ExtendTree<Node> = (newFragment: Node, options?: ExtendTreeOptions) => Promise<TreeRootId | undefined>;

export declare interface ExtendTreeOptions {
    signal?: AbortSignal;
    environment?: Environment;
    force?: boolean;
    onError?: (error: Error) => void;
}

export declare type FetchData<Node> = (fragment: Node, options?: {
    signal?: AbortSignal;
    environment?: Environment;
}) => Promise<{
    data: ReceivedDataTree;
    markerTreeRoot: MarkerTreeRoot;
}>;

export declare interface FieldAccessor<Value extends FieldValue = FieldValue> extends Errorable {
    readonly __type: 'FieldAccessor';
    readonly fieldName: FieldName;
    readonly value: Value | null;
    readonly valueOnServer: Value | null;
    readonly defaultValue: Value | undefined;
    readonly errors: ErrorAccessor | undefined;
    readonly hasUnpersistedChanges: boolean;
    readonly getAccessor: FieldAccessor.GetFieldAccessor<Value>;
    readonly schema: SchemaColumn;
    addError(error: ErrorAccessor.Error | string): ErrorAccessor.ClearError;
    clearErrors(): void;
    addEventListener: FieldAccessor.AddEventListener<Value>;
    updateValue(newValue: Value | null, options?: FieldAccessor.UpdateOptions): void;
    isTouchedBy(agent: FieldAccessor.TouchAgent): boolean;
    isTouched: boolean;
    getParent(): EntityAccessor;
}

export declare namespace FieldAccessor {
    export type TouchAgent = 'user' | (string & {});
    export interface UpdateOptions {
        agent?: TouchAgent;
    }
    export type GetFieldAccessor<Value extends FieldValue = FieldValue> = () => FieldAccessor<Value>;
    export type BeforeUpdateListener<Value extends FieldValue = FieldValue> = (updatedAccessor: FieldAccessor<Value>) => void;
    export type InitializeListener<Value extends FieldValue = FieldValue> = (getAccessor: GetFieldAccessor<Value>, options: BatchUpdatesOptions) => void;
    export type UpdateListener<Value extends FieldValue = FieldValue> = (accessor: FieldAccessor<Value>) => void;
    export type RuntimeFieldEventListenerMap<Value extends FieldValue = FieldValue> = {
        beforeUpdate: BeforeUpdateListener<Value>;
        update: UpdateListener<Value>;
    };
    export type FieldEventListenerMap<Value extends FieldValue = FieldValue> = RuntimeFieldEventListenerMap<Value> & {
        initialize: InitializeListener<Value>;
    };
    export type FieldEventType = keyof FieldEventListenerMap;
    export type AddEventListener<Value extends FieldValue = FieldValue> = <Type extends FieldEventType>(event: {
        type: Type;
        key?: string;
    }, listener: FieldEventListenerMap<Value>[Type]) => () => void;
}

export declare type FieldEventListenerStore<Value extends FieldValue = FieldValue> = EventListenersStore<FieldAccessor.FieldEventListenerMap<Value>>;

/**
 * A nonbearing field is only defined in context of create mutations. An entity will be created if and only if some
 * other fields (not just nonbearing fields) are filled as well. This is particularly useful for programmatically
 * controlled fields within repeaters.
 */
export declare class FieldMarker {
    readonly parameters: Omit<RelativeSingleField, 'hasOneRelationPath'>;
    readonly placeholderName: string;
    constructor(parameters: Omit<RelativeSingleField, 'hasOneRelationPath'>);
    get fieldName(): FieldName;
    get isNonbearing(): boolean;
    get defaultValue(): FieldValue | undefined;
}

export declare type FieldMeta = ('readable' | 'updatable')[];

export declare type FieldName = string;

export declare type FieldValue = JsonValue;

export declare type Filter<T = never> = Input.Where<Input.Condition<Input.ColumnValue<T>>>;

export { generateUuid }

export declare type GenericEventsMap = {
    [K in string]: (...args: any[]) => void | AnyFunction | Promise<void | AnyFunction>;
};

export declare type GetEntityByKey = (key: string | (() => EntityAccessor)) => EntityAccessor;

export declare type GetEntityListSubTree = (parametersOrAlias: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList, treeId?: TreeRootId, environment?: Environment) => EntityListAccessor;

export declare type GetEntitySubTree = (parametersOrAlias: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity, treeId?: TreeRootId, environment?: Environment) => EntityAccessor;

export declare interface HasManyRelation {
    field: FieldName;
    orderBy: OrderBy | undefined;
    offset: Offset | undefined;
    limit: Limit | undefined;
    filter: Filter | undefined;
    expectedMutation: ExpectedRelationMutation;
    initialEntityCount: number;
    isNonbearing: boolean;
    setOnCreate: SetOnCreate;
    meta: FieldMeta;
    eventListeners: EntityListEventListenerStore | undefined;
    childEventListeners: EntityEventListenerStore | undefined;
}

export declare class HasManyRelationMarker {
    readonly parameters: HasManyRelation;
    readonly fields: EntityFieldMarkersContainer;
    readonly environment: Environment;
    readonly placeholderName: string;
    constructor(parameters: HasManyRelation, fields: EntityFieldMarkersContainer, environment: Environment);
    get isNonbearing(): boolean;
}

export declare interface HasOneRelation {
    field: FieldName;
    reducedBy: UniqueWhere | undefined;
    filter: Filter | undefined;
    expectedMutation: ExpectedRelationMutation;
    isNonbearing: boolean;
    setOnCreate: SetOnCreate;
    meta: FieldMeta;
    eventListeners: EntityEventListenerStore | undefined;
}

export declare class HasOneRelationMarker {
    readonly parameters: HasOneRelation;
    readonly fields: EntityFieldMarkersContainer;
    readonly environment: Environment;
    readonly placeholderName: string;
    constructor(parameters: HasOneRelation, fields: EntityFieldMarkersContainer, environment: Environment);
    get isNonbearing(): boolean;
}

export declare interface InvalidInputPersistResult {
    type: 'invalidInput';
    errors: ErrorAccessor.Error[];
    response?: DataBindingTransactionResult;
}

export declare interface InvalidResponseResult {
    type: 'invalidResponse';
    errors: any;
}

export declare interface InverseRelation extends BaseRelation {
    side: 'inverse';
    ownedBy: FieldName;
    inversedBy?: never;
}

export declare const isEntityAccessor: (accessor: unknown) => accessor is EntityAccessor;

export declare const isEntityListAccessor: (accessor: unknown) => accessor is EntityListAccessor;

export declare const isErrorPersistResult: (result: unknown) => result is ErrorPersistResult;

export declare const isFieldAccessor: (accessor: unknown) => accessor is FieldAccessor;

export declare interface JsonArray<Ext = never> extends Array<JsonValue<Ext>> {
}

export declare interface JsonObject<Ext = never> {
    [key: string]: JsonValue<Ext>;
}

export declare type JsonValue<Ext = never> = string | number | boolean | null | JsonObject<Ext> | JsonArray<Ext> | Ext;

export declare interface JustSuccessPersistResult {
    type: 'justSuccess';
    persistedEntityIds: EntityId[];
    afterPersistError?: any;
}

export declare const LeafFieldDefaults: {
    readonly isNonbearing: false;
};

export declare type Limit = number;

export declare class LocalizedBindingError extends BindingError {
    readonly markerPath: MeaningfulMarker[];
    constructor(message: string, markerPath: MeaningfulMarker[]);
    nestedIn(wrapper: EntitySubTreeMarker | EntityListSubTreeMarker | HasOneRelationMarker | HasManyRelationMarker): LocalizedBindingError;
}

export declare class MarkerComparator {
    static isSubTreeSubsetOf(candidate: EntitySubTreeMarker | EntityListSubTreeMarker, superset: EntitySubTreeMarker | EntityListSubTreeMarker): boolean;
    static assertEntityMarkersSubsetOf(candidate: EntityFieldMarkersContainer, superset: EntityFieldMarkersContainer): void;
    private static assertSubsetOf;
    private static isSubsetOf;
}

export declare class MarkerFactory {
    static createEntitySubTreeMarker(entity: SugaredQualifiedSingleEntity, fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker, environment: Environment): EntityFieldsWithHoistablesMarker;
    static createUnconstrainedEntitySubTreeMarker(entity: SugaredUnconstrainedQualifiedSingleEntity, fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker, environment: Environment): EntityFieldsWithHoistablesMarker;
    static createEntityListSubTreeMarker(entityList: SugaredQualifiedEntityList, fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker, environment: Environment): EntityFieldsWithHoistablesMarker;
    static createUnconstrainedEntityListSubTreeMarker(entityList: SugaredUnconstrainedQualifiedEntityList, fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker, environment: Environment): EntityFieldsWithHoistablesMarker;
    static createParentEntityMarker(parentEntity: SugaredParentEntityParameters, fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker, environment: Environment): EntityFieldsWithHoistablesMarker;
    static createEntityFieldsWithHoistablesMarker(fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker, environment: Environment): EntityFieldsWithHoistablesMarker;
    static createRelativeSingleEntityFields(field: SugaredRelativeSingleEntity, environment: Environment, fields: EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer): EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer;
    static createRelativeEntityListFields(field: SugaredRelativeEntityList, environment: Environment, fields: EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer): EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer;
    static createFieldMarker(field: SugaredRelativeSingleField, environment: Environment): EntityFieldMarkersContainer;
    private static wrapRelativeSingleField;
    private static wrapRelativeEntityFieldMarkers;
    static createEntityFieldMarkersContainer(marker: EntityFieldMarker | undefined): EntityFieldMarkersContainer;
    private static createHasOneRelationMarker;
    private static createHasManyRelationMarker;
    private static createSubTreeMarker;
}

export declare class MarkerMerger {
    static mergeMarkers(original: MeaningfulMarker, fresh: MeaningfulMarker): MeaningfulMarker;
    static mergeMarkerTreeRoots(original: MarkerTreeRoot, fresh: MarkerTreeRoot): MarkerTreeRoot;
    static mergeSubTreeMarkers(original: SubTreeMarkers | undefined, fresh: SubTreeMarkers | undefined): SubTreeMarkers | undefined;
    static mergeSubTreePlaceholdersByAliases(original: ReadonlyMap<Alias, PlaceholderName>, fresh: ReadonlyMap<Alias, PlaceholderName>): Map<string, string>;
    static mergeEntityFields(original: SubTreeMarkers, fresh: SubTreeMarkers): SubTreeMarkers;
    static mergeEntityFields(original: EntityFieldMarkers, fresh: EntityFieldMarkers): EntityFieldMarkers;
    static mergeEntityFieldPlaceholders(original: EntityFieldPlaceholders, fresh: EntityFieldPlaceholders): EntityFieldPlaceholders;
    static mergeEntityFieldsContainers(original: EntityFieldMarkersContainer, fresh: EntityFieldMarkersContainer): EntityFieldMarkersContainer;
    static mergeHasOneRelationMarkers(original: HasOneRelationMarker, fresh: HasOneRelationMarker): HasOneRelationMarker;
    static mergeHasManyRelationMarkers(original: HasManyRelationMarker, fresh: HasManyRelationMarker): HasManyRelationMarker;
    static mergeEntitySubTreeMarkers(original: EntitySubTreeMarker, fresh: EntitySubTreeMarker): EntitySubTreeMarker;
    static mergeEntityListSubTreeMarkers(original: EntityListSubTreeMarker, fresh: EntityListSubTreeMarker): EntityListSubTreeMarker;
    static mergeFieldMarkers(original: FieldMarker, fresh: FieldMarker): FieldMarker;
    static mergeInSystemFields(original: EntityFieldMarkersContainer | undefined): EntityFieldMarkersContainer;
    static mergeEnvironments(original: Environment, fresh: Environment): Environment;
    private static rejectRelationScalarCombo;
}

export declare class MarkerTreeRoot {
    readonly subTrees: SubTreeMarkers;
    readonly placeholdersByAliases: ReadonlyMap<Alias, PlaceholderName>;
    constructor(subTrees: SubTreeMarkers, placeholdersByAliases: ReadonlyMap<Alias, PlaceholderName>);
}

export declare type MeaningfulMarker = FieldMarker | HasOneRelationMarker | HasManyRelationMarker | EntityListSubTreeMarker | EntitySubTreeMarker;

export declare const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export declare interface NothingToPersistPersistResult {
    type: 'nothingToPersist';
}

export declare type Offset = number;

export declare type OptionallyVariableFieldValue = FieldValue | VariableFieldValue;

export declare type OrderBy = Input.OrderBy<`${Input.OrderDirection}`>[];

export declare interface OwningRelation extends BaseRelation {
    side: 'owning';
    inversedBy: FieldName | null;
    ownedBy?: never;
}

export declare interface ParentEntityParameters {
    eventListeners: EntityEventListenerStore | undefined;
}

declare interface ParsedHasManyRelation {
    field: FieldName;
    filter: Filter | undefined;
}

declare interface ParsedHasOneRelation {
    filter: Filter | undefined;
    field: FieldName;
    reducedBy: UniqueWhere | undefined;
}

declare interface ParsedQualifiedEntityList {
    entityName: EntityName;
    hasOneRelationPath: ParsedHasOneRelation[];
    filter: Filter | undefined;
}

declare interface ParsedQualifiedFieldList {
    field: FieldName;
    entityName: EntityName;
    filter: Filter | undefined;
    hasOneRelationPath: ParsedHasOneRelation[];
}

declare interface ParsedQualifiedSingleEntity {
    where: UniqueWhere;
    filter: Filter | undefined;
    entityName: EntityName;
    hasOneRelationPath: ParsedHasOneRelation[];
}

declare interface ParsedRelativeEntityList {
    hasOneRelationPath: ParsedHasOneRelation[];
    hasManyRelation: ParsedHasManyRelation;
}

declare interface ParsedRelativeSingleEntity {
    hasOneRelationPath: ParsedHasOneRelation[];
}

declare interface ParsedRelativeSingleField {
    hasOneRelationPath: ParsedHasOneRelation[];
    field: FieldName;
}

declare interface ParsedTaggedMap {
    name: string;
    entries: ParsedTaggedMapEntry[];
}

declare interface ParsedTaggedMapEntry {
    key: string;
    value: ParsedTaggedMapLiteralValue | ParsedTaggedMapVariableValue;
}

declare interface ParsedTaggedMapLiteralValue {
    type: 'literal';
    value: string | number;
}

declare interface ParsedTaggedMapVariableValue {
    type: 'variable';
    value: string;
}

declare interface ParsedUnconstrainedQualifiedEntityList {
    entityName: EntityName;
    hasOneRelationPath: ParsedHasOneRelation[];
}

declare interface ParsedUnconstrainedQualifiedSingleEntity {
    entityName: EntityName;
    hasOneRelationPath: ParsedHasOneRelation[];
}

/**
 * TODO:
 * 	- double quoted strings
 * 	- collections (objects & lists)
 * 	- collection operators (e.g. 'in', 'notIn', etc.)
 * 	- filtering toOne
 */
export declare class Parser extends EmbeddedActionsParser {
    private static rawInput;
    private static lexer;
    private static parser;
    private static environment;
    private static cacheStore;
    private qualifiedEntityList;
    private qualifiedFieldList;
    private qualifiedSingleEntity;
    private unconstrainedQualifiedEntityList;
    private unconstrainedQualifiedSingleEntity;
    private relativeSingleField;
    private relativeSingleEntity;
    private relativeEntityList;
    private hasOneRelation;
    private nonUniqueWhere;
    private disjunction;
    private conjunction;
    private negation;
    private filterGroup;
    private filterAtom;
    private fieldWhere;
    private condition;
    private conditionOperator;
    private columnValue;
    private uniqueWhere;
    private orderBy;
    private taggedMap;
    private taggedMapEntries;
    private taggedMapEntry;
    private taggedMapLiteralValue;
    private taggedMapVariableValue;
    private fieldName;
    private primaryValue;
    private fieldIdentifierWithOptionalModifier;
    private fieldIdentifier;
    private identifier;
    private pageName;
    private entityIdentifier;
    private string;
    private number;
    private variable;
    private constructor();
    static parseQueryLanguageExpression<E extends Parser.EntryPoint>(input: string, entry: E, environment: Environment): Parser.ParserResult[E];
}

export declare namespace Parser {
    export namespace AST {
        export type FieldWhere = Input.FieldWhere<Condition>;
        export type ColumnValue = Input.ColumnValue;
        export type Condition = Input.Condition<ColumnValue>;
        export type ConditionOperator = keyof Pick<Condition, 'eq' | 'notEq' | 'lt' | 'lte' | 'gt' | 'gte'>;
    }
    export interface ParserResult {
        qualifiedEntityList: ParsedQualifiedEntityList;
        qualifiedFieldList: ParsedQualifiedFieldList;
        qualifiedSingleEntity: ParsedQualifiedSingleEntity;
        unconstrainedQualifiedEntityList: ParsedUnconstrainedQualifiedEntityList;
        unconstrainedQualifiedSingleEntity: ParsedUnconstrainedQualifiedSingleEntity;
        relativeSingleField: ParsedRelativeSingleField;
        relativeSingleEntity: ParsedRelativeSingleEntity;
        relativeEntityList: ParsedRelativeEntityList;
        uniqueWhere: UniqueWhere;
        filter: Filter;
        orderBy: OrderBy;
        taggedMap: ParsedTaggedMap;
        columnValue: AST.ColumnValue;
    }
    export type EntryPoint = keyof ParserResult;
}

export declare type Persist = (options?: PersistOptions) => Promise<SuccessfulPersistResult>;

export declare interface PersistErrorOptions extends AsyncBatchUpdatesOptions {
}

export declare interface PersistOptions {
    signal?: AbortSignal;
    onPersistSuccess?: (options: PersistSuccessOptions) => void | Promise<void>;
    onPersistError?: (options: PersistErrorOptions) => void | Promise<void>;
}

export declare interface PersistSuccessOptions extends AsyncBatchUpdatesOptions {
    successType: 'justSuccess' | 'nothingToPersist';
}

export declare class PlaceholderGenerator {
    static getFieldPlaceholder(fieldName: FieldName): string;
    static getHasOneRelationPlaceholder(relation: HasOneRelation): string;
    static getHasManyRelationPlaceholder(relation: HasManyRelation): string;
    static getEntitySubTreePlaceholder(subTreeParameters: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity, environment: Environment): string;
    static getEntityListSubTreePlaceholder(subTreeParameters: QualifiedEntityList | UnconstrainedQualifiedEntityList, environment: Environment): string;
}

export declare type PlaceholderName = string;

export declare class PlaceholderParametersGenerator {
    static createHasOneRelationParameters(relation: HasOneRelation): any;
    static createHasManyRelationParameters(relation: HasManyRelation): any;
    static createEntityListSubTreeParameters(parameters: QualifiedEntityList | UnconstrainedQualifiedEntityList, environment: Environment): any;
    static createEntitySubTreeParameters(parameters: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity, environment: Environment): any;
}

export declare const PRIMARY_KEY_NAME = "id";

export declare interface QualifiedEntityList {
    entityName: EntityName;
    hasOneRelationPath: HasOneRelation[];
    orderBy: OrderBy | undefined;
    offset: Offset | undefined;
    limit: Limit | undefined;
    filter: Filter | undefined;
    alias: Set<Alias> | undefined;
    expectedMutation: ExpectedQualifiedEntityMutation;
    initialEntityCount: number;
    isCreating: false;
    isNonbearing: boolean;
    setOnCreate: SetOnCreate;
    eventListeners: EntityListEventListenerStore | undefined;
    childEventListeners: EntityEventListenerStore | undefined;
}

export declare const QualifiedEntityParametersDefaults: {
    readonly expectedMutation: "anyMutation";
};

export declare type QualifiedFieldList = {
    entityName: EntityName;
    field: FieldName;
    hasOneRelationPath: HasOneRelation[];
    orderBy: OrderBy | undefined;
    offset: Offset | undefined;
    limit: Limit | undefined;
    filter: Filter | undefined;
    alias: Set<Alias> | undefined;
    defaultValue: FieldValue | undefined;
    expectedMutation: ExpectedQualifiedEntityMutation;
    initialEntityCount: number;
    isNonbearing: boolean;
    eventListeners: FieldEventListenerStore | undefined;
};

export declare interface QualifiedSingleEntity {
    entityName: EntityName;
    hasOneRelationPath: HasOneRelation[];
    where: UniqueWhere;
    filter: Filter | undefined;
    alias: Set<Alias> | undefined;
    expectedMutation: ExpectedQualifiedEntityMutation;
    isCreating: false;
    isNonbearing: boolean;
    setOnCreate: SetOnCreate;
    eventListeners: EntityEventListenerStore | undefined;
}

export declare class QueryLanguage {
    private static preparePrimitiveEntryPoint;
    private static preparePrimitiveEntryPointWithFallback;
    private static parseUnconstrainedQualifiedEntityList;
    private static parseUnconstrainedQualifiedSingleEntity;
    private static parseQualifiedEntityList;
    private static parseQualifiedFieldList;
    private static parseQualifiedSingleEntity;
    private static parseRelativeEntityList;
    private static parseRelativeSingleEntity;
    private static parseRelativeSingleField;
    static desugarUniqueWhere: (input: string | UniqueWhere, environment: Environment) => UniqueWhere;
    static desugarFilter: (input: string | Filter, environment: Environment) => Filter;
    static desugarOrderBy: (input: string | OrderBy, environment: Environment) => OrderBy;
    static desugarTaggedMap: (input: string | ParsedTaggedMap, environment: Environment) => ParsedTaggedMap;
    static desugarSetOnCreate(setOnCreate: SugaredSetOnCreate, environment: Environment): UniqueWhere;
    static desugarEventListener<F extends Function>(listener: F | Set<F>): Set<F>;
    static desugarEventListener<F extends Function>(listener: F | Set<F> | undefined): Set<F> | undefined;
    private static desugarSingleEntityEventListeners;
    private static desugarEntityListEventListeners;
    private static desugarFieldEventListeners;
    private static desugarSubTreeAlias;
    private static desugarHasOneRelation;
    private static augmentDesugaredHasOneRelationPath;
    private static augmentDesugaredHasManyRelation;
    private static desugarHasOneRelationPath;
    private static desugarHasManyRelation;
    static desugarUnconstrainedQualifiedEntityList({ entities, ...unsugarableEntityList }: SugaredUnconstrainedQualifiedEntityList, environment: Environment): UnconstrainedQualifiedEntityList;
    static desugarUnconstrainedQualifiedSingleEntity({ entity, ...unsugarableSingleEntity }: SugaredUnconstrainedQualifiedSingleEntity, environment: Environment): UnconstrainedQualifiedSingleEntity;
    static desugarQualifiedEntityList({ entities, ...unsugarableEntityList }: SugaredQualifiedEntityList, environment: Environment): QualifiedEntityList;
    static desugarQualifiedFieldList({ fields, ...unsugarableFieldList }: SugaredQualifiedFieldList, environment: Environment): QualifiedFieldList;
    static desugarQualifiedSingleEntity({ entity, ...unsugarableSingleEntity }: SugaredQualifiedSingleEntity, environment: Environment): QualifiedSingleEntity;
    static desugarParentEntityParameters(parentEntity: SugaredParentEntityParameters, environment: Environment): ParentEntityParameters;
    static desugarRelativeSingleEntity(sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity, environment: Environment): RelativeSingleEntity;
    static desugarRelativeSingleField(sugaredRelativeSingleField: string | SugaredRelativeSingleField, environment: Environment): RelativeSingleField;
    static desugarRelativeEntityList(sugaredRelativeEntityList: string | SugaredRelativeEntityList, environment: Environment): RelativeEntityList;
}

export declare class QueryLanguageError extends Error {
}

export declare interface QueryRequestResponse {
    data: ReceivedDataTree;
    errors?: {
        message: string;
        path?: string[];
    }[];
}

export declare interface RawSchema {
    enums: RawSchemaEnum[];
    entities: RawSchemaEntity[];
}

declare interface RawSchemaEntity {
    name: EntityName;
    customPrimaryAllowed: boolean;
    fields: RawSchemaFields;
    unique: {
        fields: string[];
    }[];
}

declare interface RawSchemaEnum {
    name: SchemaEnumName;
    values: string[];
}

declare type RawSchemaFields = Array<SchemaRelation | SchemaColumn>;

export declare type ReceivedData = ReceivedEntityData | ReceivedEntityData[];

export declare interface ReceivedDataTree {
    [treeId: string]: ReceivedData | null;
}

export declare type ReceivedEntityData = {
    __typename: string;
    _meta?: {
        [fieldName: string]: {
            readable?: boolean;
            updatable?: boolean;
        };
    };
    id: EntityId;
} & {
    [fieldName: string]: ReceivedFieldData;
};

export declare type ReceivedFieldData = FieldValue | ReceivedEntityData | Array<ReceivedEntityData>;

export declare const RelationDefaults: {
    readonly expectedMutation: "anyMutation";
};

export declare interface RelativeEntityList {
    hasOneRelationPath: HasOneRelation[];
    hasManyRelation: HasManyRelation;
}

export declare interface RelativeSingleEntity {
    hasOneRelationPath: HasOneRelation[];
}

export declare type RelativeSingleField = {
    field: FieldName;
    hasOneRelationPath: HasOneRelation[];
    defaultValue: FieldValue | undefined;
    isNonbearing: boolean;
    meta: FieldMeta;
    eventListeners: FieldEventListenerStore | undefined;
};

export declare type RemovalType = 'disconnect' | 'delete';

export declare type RuntimeId = ServerId | ClientGeneratedUuid | UnpersistedEntityDummyId;

export declare interface RuntimeIdSpec {
    existsOnServer: boolean;
    value: EntityId;
    uniqueValue: UniqueEntityId;
}

export declare type Scalar = string | number | boolean | null;

export declare class Schema {
    private readonly store;
    constructor(store: SchemaStore);
    getEnumNames(): string[];
    getEnumValues(enumName: SchemaEnumName): string[];
    getEntityOrUndefined(entityName: EntityName): SchemaEntity | undefined;
    getEntityNames(): string[];
    getEntity(entityName: EntityName): SchemaEntity;
    getEntityFieldOrUndefined(entityName: EntityName, fieldName: FieldName): SchemaField | undefined;
    getEntityField(entityName: EntityName, fieldName: FieldName): SchemaField;
    getEntityColumn(entityName: EntityName, fieldName: FieldName): SchemaColumn;
    getEntityRelation(entityName: EntityName, fieldName: FieldName): SchemaRelation;
}

export declare interface SchemaColumn {
    __typename: '_Column';
    defaultValue: any;
    name: FieldName;
    nullable: boolean;
    type: SchemaColumnType;
    enumName: SchemaEnumName | null;
}

export declare type SchemaColumnType = SchemaKnownColumnType | string;

export declare type SchemaEntities = Map<EntityName, SchemaEntity>;

export declare interface SchemaEntity {
    name: EntityName;
    customPrimaryAllowed: boolean;
    fields: SchemaFields;
    unique: SchemaUniqueConstraint[];
}

export declare type SchemaEnumName = string;

export declare type SchemaEnums = Map<SchemaEnumName, SchemaEnumValues>;

export declare type SchemaEnumValues = Set<string>;

export declare type SchemaField = SchemaRelation | SchemaColumn;

export declare type SchemaFields = Map<FieldName, SchemaField>;

export declare type SchemaKnownColumnType = 'Bool' | 'Date' | 'DateTime' | 'Double' | 'Enum' | 'Integer' | 'String' | 'Uuid' | 'Time';

export declare class SchemaLoader {
    private static readonly schemaLoadCache;
    private static readonly schemaQuery;
    static loadSchema(client: GraphQlClient, options?: GraphQlClientRequestOptions): Promise<Schema>;
}

export declare class SchemaPreprocessor {
    static processRawSchema(rawSchema: RawSchema): SchemaStore;
    private static processRawEnums;
    private static processRawEntities;
    private static processRawFields;
}

export declare type SchemaRelation = OwningRelation | InverseRelation;

export declare interface SchemaRelationOrderBy {
    path: string[];
    direction: 'asc' | 'desc';
}

export declare interface SchemaStore {
    enums: SchemaEnums;
    entities: SchemaEntities;
}

export declare interface SchemaUniqueConstraint {
    fields: Set<FieldName>;
}

export declare class ServerId implements RuntimeIdSpec {
    readonly value: EntityId;
    readonly entityName: string;
    get existsOnServer(): true;
    constructor(value: EntityId, entityName: string);
    get uniqueValue(): UniqueEntityId;
    static formatUniqueValue(id: EntityId, entityName: string): UniqueEntityId;
}

export declare type SetOnCreate = UniqueWhere | undefined;

export declare type SubTreeMarkers = ReadonlyMap<PlaceholderName, EntitySubTreeMarker | EntityListSubTreeMarker>;

export declare type SuccessfulPersistResult = NothingToPersistPersistResult | JustSuccessPersistResult;

export declare interface SugarableHasManyRelation {
    filter?: SugaredFilter;
    field: FieldName;
}

export declare interface SugarableHasOneRelation {
    field: FieldName;
    reducedBy?: SugaredUniqueWhere;
    filter?: SugaredFilter;
}

export declare type SugaredFilter = Filter | string;

export declare type SugaredOrderBy = OrderBy | string;

export declare interface SugaredParentEntityParameters extends UnsugarableSingleEntityEventListeners {
}

export declare interface SugaredQualifiedEntityList extends UnsugarableEntityListEventListeners {
    entities: string | {
        filter?: SugaredFilter;
        hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation;
        entityName: EntityName;
    };
    orderBy?: SugaredOrderBy;
    offset?: Offset;
    limit?: Limit;
    alias?: Alias | Set<Alias>;
    expectedMutation?: ExpectedQualifiedEntityMutation;
    initialEntityCount?: number;
    isCreating?: false;
    isNonbearing?: boolean;
    setOnCreate?: SugaredSetOnCreate;
}

export declare interface SugaredQualifiedFieldList extends UnsugarableFieldEventListeners {
    fields: string | {
        filter?: SugaredFilter;
        field: FieldName;
        entityName: EntityName;
        hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation;
    };
    orderBy?: SugaredOrderBy;
    offset?: Offset;
    limit?: Limit;
    alias?: Alias | Set<Alias>;
    defaultValue?: OptionallyVariableFieldValue;
    expectedMutation?: ExpectedQualifiedEntityMutation;
    initialEntityCount?: number;
    isNonbearing?: boolean;
}

export declare interface SugaredQualifiedSingleEntity extends UnsugarableSingleEntityEventListeners {
    entity: string | {
        where: SugaredUniqueWhere;
        filter?: SugaredFilter;
        hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation;
        entityName: EntityName;
    };
    alias?: Alias | Set<Alias>;
    expectedMutation?: ExpectedQualifiedEntityMutation;
    isCreating?: false;
    isNonbearing?: boolean;
    setOnCreate?: SugaredSetOnCreate;
}

export declare interface SugaredRelativeEntityList extends UnsugarableEntityListEventListeners {
    field: string | {
        hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation;
        hasManyRelation: SugarableHasManyRelation;
    };
    orderBy?: SugaredOrderBy;
    offset?: Offset;
    limit?: Limit;
    expectedMutation?: ExpectedRelationMutation;
    initialEntityCount?: number;
    isNonbearing?: boolean;
    setOnCreate?: SugaredSetOnCreate;
    withMeta?: FieldMeta;
}

export declare interface SugaredRelativeSingleEntity extends UnsugarableSingleEntityEventListeners {
    field: string | SugarableHasOneRelation[] | SugarableHasOneRelation;
    expectedMutation?: ExpectedRelationMutation;
    isNonbearing?: boolean;
    setOnCreate?: SugaredSetOnCreate;
    withMeta?: FieldMeta;
}

export declare interface SugaredRelativeSingleField extends UnsugarableFieldEventListeners {
    /** E.g. authors(id = 123).person.name */
    field: string | {
        field: FieldName;
        hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation;
    };
    defaultValue?: OptionallyVariableFieldValue;
    isNonbearing?: boolean;
    withMeta?: FieldMeta;
}

export declare type SugaredSetOnCreate = SugaredUniqueWhere | SugaredUniqueWhere[] | Exclude<SetOnCreate, undefined>;

export declare interface SugaredUnconstrainedQualifiedEntityList extends UnsugarableEntityListEventListeners {
    entities: string | {
        hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation;
        entityName: EntityName;
    };
    alias?: Alias | Set<Alias>;
    expectedMutation?: ExpectedQualifiedEntityMutation;
    initialEntityCount?: number;
    isCreating: true;
    isNonbearing?: boolean;
    isUnpersisted?: boolean;
    setOnCreate?: SugaredSetOnCreate;
}

export declare interface SugaredUnconstrainedQualifiedSingleEntity extends UnsugarableSingleEntityEventListeners {
    entity: string | {
        entityName: EntityName;
        hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation;
    };
    alias?: Alias | Set<Alias>;
    expectedMutation?: ExpectedQualifiedEntityMutation;
    isCreating: true;
    isNonbearing?: boolean;
    isUnpersisted?: boolean;
    setOnCreate?: SugaredSetOnCreate;
}

export declare type SugaredUniqueWhere = UniqueWhere | string;

export declare const throwBindingError: (message: string) => never;

export declare const tokenList: TokenType[];

export declare namespace TokenRegExps {
    const entityIdentifier: RegExp;
    const identifier: RegExp;
    const dotSeparatedIdentifier: RegExp;
}

export declare const tokens: {
    WhiteSpace: TokenType;
    EntityIdentifier: TokenType;
    Identifier: TokenType;
    DollarSign: TokenType;
    Dot: TokenType;
    Comma: TokenType;
    Colon: TokenType;
    Slash: TokenType;
    NumberLiteral: TokenType;
    StringLiteral: TokenType;
    LeftParenthesis: TokenType;
    RightParenthesis: TokenType;
    LeftBracket: TokenType;
    RightBracket: TokenType;
    NotEquals: TokenType;
    True: TokenType;
    False: TokenType;
    Null: TokenType;
    Equals: TokenType;
    Not: TokenType;
    And: TokenType;
    Or: TokenType;
    LowerEqual: TokenType;
    GreaterEqual: TokenType;
    LowerThan: TokenType;
    GreaterThan: TokenType;
};

export declare class TreeNodeEnvironmentFactory {
    static createEnvironmentForEntityListSubtree(environment: Environment, sugaredEntityList: SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList): Environment;
    static createEnvironmentForEntitySubtree(environment: Environment, sugaredEntityList: SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity): Environment;
    static createEnvironmentForEntityList(environment: Environment, sugaredRelativeEntityList: SugaredRelativeEntityList): Environment;
    static createEnvironmentForEntity(environment: Environment, sugaredRelativeSingleEntity: SugaredRelativeSingleEntity): Environment<Environment.AnyNode | undefined>;
    static createEnvironmentForField(environment: Environment, sugaredRelativeSingleField: SugaredRelativeSingleField): Environment<{
        type: "column";
        entity: SchemaEntity;
        field: SchemaColumn;
    }>;
    private static traverseHasOnePath;
}

export declare class TreeNodeUtils {
    static resolveEntity(schema: Schema, entityName: string, type: 'entity' | 'entity list'): SchemaEntity;
    static resolveHasOneRelation(environment: Environment, field: string, isReduced: boolean): SchemaRelation;
    static resolveHasManyRelation(environment: Environment, field: string): SchemaRelation;
    private static resolveRelation;
    static resolveColumn(environment: Environment, fieldName: string): SchemaColumn;
    private static resolveField;
    static describeLocation(environment: Environment): string;
    static recommendAlternative(original: string, possibleAlternatives: Iterable<string>): string | undefined;
}

export declare class TreeParameterMerger {
    static mergeHasOneRelationsWithSamePlaceholders(original: HasOneRelation, fresh: HasOneRelation): HasOneRelation;
    static mergeHasManyRelationsWithSamePlaceholders(original: HasManyRelation, fresh: HasManyRelation): HasManyRelation;
    static mergeEntitySubTreeParametersWithSamePlaceholders(original: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity, fresh: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity): QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity;
    static mergeEntityListSubTreeParametersWithSamePlaceholders(original: QualifiedEntityList | UnconstrainedQualifiedEntityList, fresh: QualifiedEntityList | UnconstrainedQualifiedEntityList): QualifiedEntityList | UnconstrainedQualifiedEntityList;
    static mergeSingleField(original: Omit<RelativeSingleField, 'hasOneRelationPath'>, fresh: Omit<RelativeSingleField, 'hasOneRelationPath'>): Omit<RelativeSingleField, 'hasOneRelationPath'>;
    static mergeSetOnCreate(original: SetOnCreate, fresh: SetOnCreate): SetOnCreate;
    private static mergeSets;
    static mergeParentEntityParameters(original: ParentEntityParameters | undefined, fresh: ParentEntityParameters | undefined): ParentEntityParameters | undefined;
    static mergeInParentEntity<Original extends Record<Key, EntityEventListenerStore | undefined>, Key extends keyof Original>(original: Original, key: Key, parentEntity: ParentEntityParameters | undefined): Original;
    private static mergeEventStore;
    private static mergeExpectedRelationMutation;
    private static mergeExpectedQualifiedEntityMutation;
    private static mergeSubTreeAliases;
    private static mergeFieldMeta;
}

export declare class TreeRootAccessor<Node> {
    readonly hasUnpersistedChanges: boolean;
    readonly isMutating: boolean;
    readonly bindingOperations: BindingOperations<Node>;
    /**
     * Whenever an update occurs, a new instance of this class is created.
     */
    constructor(hasUnpersistedChanges: boolean, isMutating: boolean, bindingOperations: BindingOperations<Node>);
}

export declare type TreeRootId = string;

export declare const TYPENAME_KEY_NAME = "__typename";

export declare interface UnconstrainedQualifiedEntityList {
    entityName: EntityName;
    hasOneRelationPath: HasOneRelation[];
    alias: Set<Alias> | undefined;
    expectedMutation: ExpectedQualifiedEntityMutation;
    initialEntityCount: number;
    isCreating: true;
    isNonbearing: boolean;
    isUnpersisted: boolean;
    setOnCreate: SetOnCreate;
    eventListeners: EntityListEventListenerStore | undefined;
    childEventListeners: EntityEventListenerStore | undefined;
}

export declare interface UnconstrainedQualifiedSingleEntity {
    entityName: EntityName;
    hasOneRelationPath: HasOneRelation[];
    alias: Set<Alias> | undefined;
    expectedMutation: ExpectedQualifiedEntityMutation;
    isCreating: true;
    isNonbearing: boolean;
    isUnpersisted: boolean;
    setOnCreate: SetOnCreate;
    eventListeners: EntityEventListenerStore | undefined;
}

export declare type UniqueEntityId = string & {
    __type: 'UniqueEntityId';
};

export declare type UniqueWhere<T = never> = Input.UniqueWhere<T>;

export declare class UnpersistedEntityDummyId implements RuntimeIdSpec {
    get existsOnServer(): false;
    readonly value: string;
    private static getNextSeed;
    constructor();
    private static entropyLength;
    private static dummyIdRegex;
    static matchesDummyId(candidate: EntityId): boolean;
    get uniqueValue(): UniqueEntityId;
}

export declare type UnsugarableEntityListEventListeners = {
    onBeforePersist?: EntityListAccessor.BeforePersistHandler | Set<EntityListAccessor.BeforePersistHandler>;
    onBeforeUpdate?: EntityListAccessor.BatchUpdatesHandler | Set<EntityListAccessor.BatchUpdatesHandler>;
    onPersistError?: EntityListAccessor.PersistErrorHandler | Set<EntityListAccessor.PersistErrorHandler>;
    onPersistSuccess?: EntityListAccessor.PersistSuccessHandler | Set<EntityListAccessor.PersistSuccessHandler>;
    onUpdate?: EntityListAccessor.UpdateListener | Set<EntityListAccessor.UpdateListener>;
    onInitialize?: EntityListAccessor.BatchUpdatesHandler | Set<EntityListAccessor.BatchUpdatesHandler>;
    onChildBeforeUpdate?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>;
    onChildInitialize?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>;
    onChildUpdate?: EntityAccessor.UpdateListener | Set<EntityAccessor.UpdateListener>;
};

export declare type UnsugarableFieldEventListeners<Persisted extends FieldValue = FieldValue> = {
    onInitialize?: FieldAccessor.InitializeListener<Persisted> | Set<FieldAccessor.InitializeListener<Persisted>>;
    onBeforeUpdate?: FieldAccessor.BeforeUpdateListener<Persisted> | Set<FieldAccessor.BeforeUpdateListener<Persisted>>;
    onUpdate?: FieldAccessor.UpdateListener<Persisted> | Set<FieldAccessor.UpdateListener<Persisted>>;
};

export declare type UnsugarableSingleEntityEventListeners = {
    onBeforePersist?: EntityAccessor.BeforePersistHandler | Set<EntityAccessor.BeforePersistHandler>;
    onBeforeUpdate?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>;
    onPersistError?: EntityAccessor.PersistErrorHandler | Set<EntityAccessor.PersistErrorHandler>;
    onPersistSuccess?: EntityAccessor.PersistSuccessHandler | Set<EntityAccessor.PersistSuccessHandler>;
    onUpdate?: EntityAccessor.UpdateListener | Set<EntityAccessor.UpdateListener>;
    onInitialize?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>;
    onConnectionUpdate?: {
        [fieldName: string]: EntityAccessor.UpdateListener | Set<EntityAccessor.UpdateListener>;
    };
};

export declare class VariableFieldValue {
    readonly variableName: string;
    constructor(variableName: string);
}

export declare class VariableInputTransformer {
    static transformValue(value: OptionallyVariableFieldValue, environment: Environment): FieldValue;
    static transformVariableFieldValue(variableFieldValue: VariableFieldValue, environment: Environment): FieldValue;
}

export declare const whereToFilter: (by: Input.UniqueWhere) => Input.Where<Input.Condition<Input.ColumnValue>>;

export declare const wrapFilterInHasOnes: (path: HasOneRelation[], filter: Filter) => Filter;

export { }
