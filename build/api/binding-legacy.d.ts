import type { Alias } from '@contember/binding-common';
import type { AsyncBatchUpdatesOptions } from '@contember/binding-common';
import { BatchUpdatesOptions } from '@contember/binding-common';
import type { BijectiveIndexedMap } from '@contember/utilities';
import { ContentEntitySelection } from '@contember/client';
import { ContentQuery } from '@contember/client';
import { ContentQueryBuilder } from '@contember/client';
import { DataBindingTransactionResult } from '@contember/binding-common';
import { EntityAccessor } from '@contember/binding-common';
import type { EntityEventListenerStore } from '@contember/binding-common';
import { EntityFieldMarkers } from '@contember/binding-common';
import { EntityId } from '@contember/binding-common';
import { EntityListAccessor } from '@contember/binding-common';
import type { EntityListEventListenerStore } from '@contember/binding-common';
import { EntityListSubTreeMarker } from '@contember/binding-common';
import { EntityName } from '@contember/binding-common';
import { EntityRealmKey } from '@contember/binding-common';
import { EntitySubTreeMarker } from '@contember/binding-common';
import { Environment } from '@contember/binding-common';
import { ErrorAccessor } from '@contember/binding-common';
import type { EventListenersStore } from '@contember/binding-common';
import { ExtendTreeOptions } from '@contember/binding-common';
import { FieldAccessor } from '@contember/binding-common';
import type { FieldEventListenerStore } from '@contember/binding-common';
import type { FieldMarker } from '@contember/binding-common';
import { FieldName } from '@contember/binding-common';
import { FieldValue } from '@contember/binding-common';
import { GraphQlClient } from '@contember/client';
import { GraphQlClientError } from '@contember/client';
import { HasManyRelationMarker } from '@contember/binding-common';
import { HasOneRelationMarker } from '@contember/binding-common';
import { MarkerTreeRoot } from '@contember/binding-common';
import type { PersistErrorOptions } from '@contember/binding-common';
import type { PersistSuccessOptions } from '@contember/binding-common';
import type { PlaceholderName } from '@contember/binding-common';
import { ReceivedDataTree } from '@contember/binding-common';
import { RelativeEntityList } from '@contember/binding-common';
import { RelativeSingleEntity } from '@contember/binding-common';
import { RelativeSingleField } from '@contember/binding-common';
import type { RemovalType } from '@contember/binding-common';
import { RuntimeId } from '@contember/binding-common';
import type { Schema } from '@contember/binding-common';
import { SchemaColumn } from '@contember/binding-common';
import type { ServerId } from '@contember/binding-common';
import { SuccessfulPersistResult } from '@contember/binding-common';
import type { SugaredQualifiedEntityList } from '@contember/binding-common';
import type { SugaredQualifiedSingleEntity } from '@contember/binding-common';
import { SugaredRelativeEntityList } from '@contember/binding-common';
import { SugaredRelativeSingleEntity } from '@contember/binding-common';
import { SugaredRelativeSingleField } from '@contember/binding-common';
import type { SugaredUnconstrainedQualifiedEntityList } from '@contember/binding-common';
import type { SugaredUnconstrainedQualifiedSingleEntity } from '@contember/binding-common';
import { TreeRootAccessor } from '@contember/binding-common';
import type { TreeRootId } from '@contember/binding-common';
import type { UniqueEntityId } from '@contember/binding-common';
import type { UnpersistedEntityDummyId } from '@contember/binding-common';

declare class AccessorErrorManager {
    private readonly eventManager;
    private readonly treeStore;
    private errorsByState;
    private getNewErrorId;
    constructor(eventManager: EventManager, treeStore: TreeStore);
    hasErrors(): boolean;
    getErrors(): ErrorAccessor.Error[];
    clearErrors(): void;
    clearErrorsByState(state: StateNode): void;
    replaceErrors(data: DataBindingTransactionResult, operations: SubMutationOperation[]): void;
    addError(state: StateNode, error: ErrorAccessor.Error): () => void;
    private addSeveralErrors;
    private setRootStateErrors;
    private setEntityStateErrors;
    private setEntityListStateErrors;
    private dumpErrorData;
}

export declare interface BindingConfig {
    beforeUpdateSettleLimit: number;
    beforePersistSettleLimit: number;
    persistSuccessSettleLimit: number;
}

export declare class Config {
    private static defaultConfig;
    private readonly config;
    constructor(config?: Partial<BindingConfig>);
    getValue<Name extends keyof BindingConfig>(name: Name): BindingConfig[Name];
    setValue<Name extends keyof BindingConfig>(name: Name, value: BindingConfig[Name]): this;
}

export declare class DataBinding<Node> {
    private readonly contentApiClient;
    private readonly systemApiClient;
    private readonly tenantApiClient;
    private readonly treeStore;
    private readonly environment;
    private readonly createMarkerTree;
    private readonly batchedUpdates;
    private readonly onUpdate;
    private readonly onError;
    private readonly onPersistSuccess;
    private readonly options;
    private readonly accessorErrorManager;
    private readonly batchUpdatesOptions;
    private readonly asyncBatchUpdatesOptions;
    private readonly bindingOperations;
    private readonly config;
    private readonly dirtinessTracker;
    private readonly eventManager;
    private readonly stateInitializer;
    private readonly treeAugmenter;
    private readonly queryBuilder;
    private readonly contentClient;
    private readonly eventListenerStore;
    constructor(contentApiClient: GraphQlClient, systemApiClient: GraphQlClient, tenantApiClient: GraphQlClient, treeStore: TreeStore, environment: Environment, createMarkerTree: (node: Node, environment: Environment) => MarkerTreeRoot, batchedUpdates: (callback: () => any) => void, onUpdate: (newData: TreeRootAccessor<Node>, binding: DataBinding<Node>) => void, onError: (error: GraphQlClientError, binding: DataBinding<Node>) => void, onPersistSuccess: (result: SuccessfulPersistResult, binding: DataBinding<Node>) => void, options: {
        skipStateUpdateAfterPersist: boolean;
    });
    private persist;
    private checkErrorsBeforePersist;
    private processEmptyPersistMutation;
    private processSuccessfulPersistResult;
    private persistFail;
    private resolvedOnUpdate;
    private pendingExtensions;
    private flushResult;
    extendTree(newFragment: Node, options?: ExtendTreeOptions): Promise<TreeRootId | undefined>;
    fetchData(fragment: Node, options?: {
        signal?: AbortSignal;
        environment?: Environment;
    }): Promise<{
        data: ReceivedDataTree;
        markerTreeRoot: MarkerTreeRoot;
    }>;
    private flushBatchedTreeExtensions;
    private fetchPersistedData;
    private resetTreeAfterSuccessfulPersist;
    private static getNextTreeRootIdSeed;
    private getNewTreeRootId;
}

export declare class DirtinessTracker {
    private changesCount;
    private touchedCount;
    getTotalTouchCount(): number;
    hasChanges(): boolean;
    reset(): void;
    increaseBy(delta: number): void;
}

export declare class EntityAccessorImpl implements EntityAccessor {
    private readonly state;
    private readonly operations;
    private readonly runtimeId;
    readonly key: EntityRealmKey;
    readonly name: EntityName;
    private readonly fieldData;
    private readonly dataFromServer;
    readonly hasUnpersistedChanges: boolean;
    readonly errors: ErrorAccessor | undefined;
    readonly environment: Environment;
    readonly getAccessor: EntityAccessor.GetEntityAccessor;
    readonly __type: "EntityAccessor";
    constructor(state: EntityRealmState, operations: EntityOperations, runtimeId: RuntimeId, key: EntityRealmKey, // ⚠️ This is *NOT* the id! ⚠️
    name: EntityName, fieldData: EntityAccessor.FieldData, dataFromServer: SingleEntityPersistedData | undefined, hasUnpersistedChanges: boolean, errors: ErrorAccessor | undefined, environment: Environment, getAccessor: EntityAccessor.GetEntityAccessor);
    get idOnServer(): EntityId | undefined;
    /**
     * Note that for entities that don't yet exist on server this will return a dummy id.
     */
    get id(): EntityId;
    get existsOnServer(): boolean;
    addError(error: ErrorAccessor.Error | string): () => void;
    addEventListener<Type extends keyof EntityAccessor.RuntimeEntityEventListenerMap>(event: {
        type: Type;
        key?: string;
    }, listener: EntityAccessor.EntityEventListenerMap[Type]): () => void;
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
    getEntity(entity: SugaredRelativeSingleEntity | string | RelativeSingleEntity): EntityAccessorImpl;
    getEntityList(entityList: SugaredRelativeEntityList | string | RelativeEntityList): EntityListAccessor;
    private raiseInvalidHasOneRelationError;
    private raiseInvalidHasManyRelationError;
    private raiseUndefinedRelationError;
    private createHintMessage;
    private getMarkersOfType;
    getParent(): EntityAccessor | EntityListAccessor | undefined;
    getMarker(): HasOneRelationMarker | EntitySubTreeMarker | HasManyRelationMarker | EntityListSubTreeMarker;
    getFieldMeta(field: string): {
        readable: boolean | undefined;
        updatable: boolean | undefined;
    };
}

export declare type EntityFieldPersistedData<Value extends EntityFieldPersistedValue = EntityFieldPersistedValue> = {
    readable: boolean | undefined;
    updatable: boolean | undefined;
    value: Value;
};

export declare type EntityFieldPersistedValue = FieldValue | ServerId | EntityListPersistedData;

export declare class EntityListAccessorImpl implements EntityListAccessor {
    private readonly state;
    private readonly operations;
    readonly name: EntityName;
    private readonly _children;
    private readonly _idsPersistedOnServer;
    readonly hasUnpersistedChanges: boolean;
    readonly errors: ErrorAccessor | undefined;
    readonly environment: Environment;
    readonly getAccessor: EntityListAccessor.GetEntityListAccessor;
    readonly __type: "EntityListAccessor";
    constructor(state: EntityListState, operations: ListOperations, name: EntityName, _children: ReadonlyMap<EntityId, {
        getAccessor: EntityAccessor.GetEntityAccessor;
    }>, _idsPersistedOnServer: ReadonlySet<EntityId>, hasUnpersistedChanges: boolean, errors: ErrorAccessor | undefined, environment: Environment, getAccessor: EntityListAccessor.GetEntityListAccessor);
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
    get idsPersistedOnServer(): Set<EntityId>;
    [Symbol.iterator](): IterableIterator<EntityAccessor>;
    hasEntityId(id: EntityId): boolean;
    isEmpty(): boolean;
    get length(): number;
    hasEntityOnServer(entityOrItsId: EntityAccessor | EntityId): boolean;
    deleteAll(): void;
    disconnectAll(): void;
    addError(error: ErrorAccessor.Error | string): () => void;
    addEventListener<Type extends keyof EntityListAccessor.RuntimeEntityListEventListenerMap>(event: {
        type: Type;
        key?: string;
    }, listener: EntityListAccessor.EntityListEventListenerMap[Type]): () => void;
    addChildEventListener<Type extends keyof EntityAccessor.EntityEventListenerMap>(event: {
        type: Type;
        key?: string;
    }, listener: EntityAccessor.EntityEventListenerMap[Type]): () => void;
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

declare type EntityListBlueprint = {
    readonly type: 'hasMany';
    readonly marker: HasManyRelationMarker;
    readonly parent: EntityRealmState;
} | {
    readonly type: 'subTree';
    readonly marker: EntityListSubTreeMarker;
    readonly parent: undefined;
};

export declare type EntityListPersistedData = Set<EntityId>;

declare interface EntityListState {
    type: 'entityList';
    accessor: EntityListAccessor | undefined;
    blueprint: EntityListBlueprint;
    children: BijectiveIndexedMap<EntityId, EntityRealmState | EntityRealmStateStub>;
    childrenWithPendingUpdates: Set<EntityRealmState> | undefined;
    entityName: EntityName;
    errors: ErrorAccessor | undefined;
    eventListeners: EntityListEventListenerStore | undefined;
    childEventListeners: EntityEventListenerStore | undefined;
    readonly getAccessor: () => EntityListAccessor;
    plannedRemovals: Map<EntityId, RemovalType> | undefined;
    unpersistedChangesCount: number;
}

declare class EntityOperations {
    private readonly accessorErrorManager;
    private readonly batchUpdatesOptions;
    private readonly eventManager;
    private readonly stateInitializer;
    private readonly treeStore;
    constructor(accessorErrorManager: AccessorErrorManager, batchUpdatesOptions: BatchUpdatesOptions, eventManager: EventManager, stateInitializer: StateInitializer, treeStore: TreeStore);
    addError(entityRealm: EntityRealmState, error: ErrorAccessor.Error): () => void;
    addEventListener<Type extends keyof EntityAccessor.RuntimeEntityEventListenerMap>(state: EntityRealmState, event: {
        type: Type;
        key?: string;
    }, listener: EntityAccessor.EntityEventListenerMap[Type]): () => void;
    batchUpdates(state: EntityRealmState, performUpdates: EntityAccessor.BatchUpdatesHandler): void;
    connectEntityAtField(outerState: EntityRealmState, fieldName: FieldName, entityToConnect: EntityAccessor): void;
    disconnectEntityAtField(outerState: EntityRealmState, fieldName: FieldName, initializeReplacement: EntityAccessor.BatchUpdatesHandler | undefined): void;
    deleteEntity(realm: EntityRealmState): void;
    private resolveHasOneRelationMarkers;
}

declare type EntityRealmBlueprint = HasOneEntityRealmBlueprint | ListEntityEntityRealmBlueprint | SubTreeEntityRealmBlueprint;

declare interface EntityRealmState {
    readonly type: 'entityRealm';
    readonly blueprint: EntityRealmBlueprint;
    entity: EntityState;
    realmKey: EntityRealmKey;
    accessor: EntityAccessor | undefined;
    readonly children: Map<PlaceholderName, StateNode | EntityRealmStateStub>;
    childrenWithPendingUpdates: Set<StateNode> | undefined;
    errors: ErrorAccessor | undefined;
    eventListeners: EntityEventListenerStore | undefined;
    fieldsWithPendingConnectionUpdates: Set<FieldName> | undefined;
    plannedHasOneDeletions: Map<PlaceholderName, EntityRealmState | EntityRealmStateStub> | undefined;
    unpersistedChangesCount: number;
    readonly getAccessor: EntityAccessor.GetEntityAccessor;
}

declare interface EntityRealmStateStub {
    readonly type: 'entityRealmStub';
    readonly blueprint: EntityRealmBlueprint;
    entity: EntityState;
    realmKey: EntityRealmKey;
    readonly getAccessor: EntityAccessor.GetEntityAccessor;
}

declare interface EntityState {
    entityName: EntityName;
    hasIdSetInStone: boolean;
    id: RuntimeId;
    isScheduledForDeletion: boolean;
    maidenId: UnpersistedEntityDummyId | undefined;
    realms: Map<EntityRealmKey, EntityRealmState | EntityRealmStateStub>;
}

export declare class EventManager {
    private readonly asyncBatchUpdatesOptions;
    private readonly batchUpdatesOptions;
    private readonly config;
    private readonly dirtinessTracker;
    private readonly onUpdate;
    private readonly treeStore;
    private readonly batchedUpdates;
    static readonly NO_CHANGES_DIFFERENCE = 0;
    private transactionDepth;
    private isFrozenWhileUpdating;
    private isMutating;
    private ongoingPersistOperation;
    private previousMetadata;
    private newlyInitializedWithListeners;
    private pendingWithBeforeUpdate;
    private rootsWithPendingUpdates;
    constructor(asyncBatchUpdatesOptions: AsyncBatchUpdatesOptions, batchUpdatesOptions: BatchUpdatesOptions, config: Config, dirtinessTracker: DirtinessTracker, onUpdate: (metadata: UpdateMetadata) => void, treeStore: TreeStore, batchedUpdates: (callback: () => any) => void);
    persistOperation(operation: () => Promise<SuccessfulPersistResult>): Promise<SuccessfulPersistResult>;
    syncTransaction<T>(transaction: () => T): T;
    syncOperation<T>(operation: () => T): T;
    asyncTransaction<T>(transaction: () => Promise<T>): Promise<T>;
    asyncOperation<T>(operation: () => Promise<T>): Promise<T>;
    private flushUpdates;
    private getNewUpdateMetadata;
    private shouldFlushUpdates;
    registerNewlyInitialized(newlyInitialized: StateNode): void;
    registerUpdatedConnection(parentState: EntityRealmState, placeholderName: PlaceholderName): void;
    registerJustUpdated(justUpdated: StateNode, changesDelta: number): void;
    private flushPendingAccessorUpdates;
    private triggerAsyncMutatingEvent;
    private triggerBeforeFlushEvents;
    private triggerOnInitialize;
    triggerOnPersistError(options: PersistErrorOptions): Promise<void>;
    triggerOnBeforePersist(): Promise<void>;
    triggerOnPersistSuccess(options: PersistSuccessOptions): Promise<void>;
    getEventListeners<State extends StateNode, EventListenerTypes extends Exclude<State['eventListeners'], undefined> extends EventListenersStore<infer Map> ? [keyof Map, Map] : never, EventType extends EventListenerTypes[0]>(state: State, event: {
        type: EventType;
        key?: string;
    }): Set<Exclude<EventListenerTypes[1][EventType], undefined>> | undefined;
    getEventDispatchers<State extends StateNode, EventListenerTypes extends Exclude<State['eventListeners'], undefined> extends EventListenersStore<infer Map> ? [keyof Map, Map] : never, EventType extends EventListenerTypes[0]>(state: State, event: {
        type: EventType;
        key?: string;
    }, listenerArgs: Parameters<Exclude<EventListenerTypes[1][EventType], undefined>>): Array<() => ReturnType<Exclude<EventListenerTypes[1][EventType], undefined>>> | undefined;
    private handleRejections;
    private validateWithoutChanges;
}

export declare class FieldAccessorImpl<Value extends FieldValue = FieldValue> implements FieldAccessor {
    private readonly state;
    private readonly operations;
    readonly fieldName: FieldName;
    readonly value: Value | null;
    readonly valueOnServer: Value | null;
    readonly defaultValue: Value | undefined;
    readonly errors: ErrorAccessor | undefined;
    readonly hasUnpersistedChanges: boolean;
    private readonly touchLog;
    readonly getAccessor: FieldAccessor.GetFieldAccessor<Value>;
    readonly schema: SchemaColumn;
    readonly __type: "FieldAccessor";
    constructor(state: FieldState<Value>, operations: FieldOperations, fieldName: FieldName, value: Value | null, valueOnServer: Value | null, defaultValue: Value | undefined, errors: ErrorAccessor | undefined, hasUnpersistedChanges: boolean, touchLog: ReadonlySet<string> | undefined, getAccessor: FieldAccessor.GetFieldAccessor<Value>, schema: SchemaColumn);
    addError(error: ErrorAccessor.Error | string): () => void;
    clearErrors(): void;
    addEventListener<Type extends keyof FieldAccessor.FieldEventListenerMap<Value>>(event: {
        type: Type;
        key?: string;
    }, listener: FieldAccessor.FieldEventListenerMap<Value>[Type]): () => void;
    updateValue(newValue: Value | null, options?: FieldAccessor.UpdateOptions): void;
    isTouchedBy(agent: 'user' | (string & {})): boolean;
    get isTouched(): boolean;
    get asTemporal(): TemporalFieldHelper;
    get asUuid(): UuidFieldHelper;
    getParent(): EntityAccessor;
}

declare class FieldHelper<Value extends FieldValue = FieldValue> {
    protected readonly getAccessor: FieldAccessor.GetFieldAccessor<Value>;
    constructor(field: FieldAccessor<Value> | FieldAccessor.GetFieldAccessor<Value>);
}

declare class FieldOperations {
    private readonly accessorErrorManager;
    private readonly eventManager;
    private readonly stateInitializer;
    private readonly treeStore;
    constructor(accessorErrorManager: AccessorErrorManager, eventManager: EventManager, stateInitializer: StateInitializer, treeStore: TreeStore);
    addError(fieldState: FieldState<any>, error: ErrorAccessor.Error): () => void;
    clearErrors(fieldState: FieldState<any>): void;
    addEventListener<Type extends keyof FieldAccessor.FieldEventListenerMap, Value extends FieldValue = FieldValue>(state: FieldState<Value>, event: {
        type: Type;
        key?: string;
    }, listener: FieldAccessor.FieldEventListenerMap<Value>[Type]): () => void;
    updateValue<Value extends FieldValue = FieldValue>(fieldState: FieldState<Value>, newValue: Value | null, { agent }?: FieldAccessor.UpdateOptions): void;
}

declare interface FieldState<Value extends FieldValue = FieldValue> {
    type: 'field';
    accessor: FieldAccessor<Value> | undefined;
    errors: ErrorAccessor | undefined;
    eventListeners: FieldEventListenerStore<Value> | undefined;
    fieldMarker: FieldMarker;
    readonly getAccessor: () => FieldAccessor;
    hasUnpersistedChanges: boolean;
    parent: EntityRealmState;
    persistedValue: Value | undefined;
    placeholderName: FieldName;
    touchLog: Set<string> | undefined;
    value: Value | null;
}

declare interface HasOneEntityRealmBlueprint {
    readonly type: 'hasOne';
    readonly marker: HasOneRelationMarker;
    readonly parent: EntityRealmState;
}

declare interface ListEntityEntityRealmBlueprint {
    readonly type: 'listEntity';
    readonly parent: EntityListState;
}

declare class ListOperations {
    private readonly accessorErrorManager;
    private readonly batchUpdatesOptions;
    private readonly eventManager;
    private readonly stateInitializer;
    private readonly treeStore;
    constructor(accessorErrorManager: AccessorErrorManager, batchUpdatesOptions: BatchUpdatesOptions, eventManager: EventManager, stateInitializer: StateInitializer, treeStore: TreeStore);
    addError(listState: EntityListState, error: ErrorAccessor.Error): () => void;
    addEventListener<Type extends keyof EntityListAccessor.RuntimeEntityListEventListenerMap>(state: EntityListState, event: {
        type: Type;
        key?: string;
    }, listener: EntityListAccessor.EntityListEventListenerMap[Type]): () => void;
    addChildEventListener<Type extends keyof EntityAccessor.EntityEventListenerMap>(state: EntityListState, event: {
        type: Type;
        key?: string;
    }, listener: EntityAccessor.EntityEventListenerMap[Type]): () => void;
    batchUpdates(state: EntityListState, performUpdates: EntityListAccessor.BatchUpdatesHandler): void;
    connectEntity(outerState: EntityListState, entityToConnect: EntityAccessor): void;
    disconnectEntity(listState: EntityListState, childEntity: EntityAccessor, options: {
        noPersist?: boolean;
    }): void;
    createNewEntity(outerState: EntityListState, initialize: EntityAccessor.BatchUpdatesHandler | undefined): RuntimeId;
    getChildEntityById(state: EntityListState, id: EntityId): EntityAccessor;
}

export declare class NormalizedPersistedData {
    readonly subTreeDataStore: SubTreeDataStore;
    readonly persistedEntityDataStore: PersistedEntityDataStore;
    constructor(subTreeDataStore: SubTreeDataStore, persistedEntityDataStore: PersistedEntityDataStore);
}

export declare type PersistedEntityDataStore = Map<UniqueEntityId, SingleEntityPersistedData>;

export declare class QueryGenerator {
    private tree;
    private qb;
    constructor(tree: MarkerTreeRoot, qb: ContentQueryBuilder);
    getReadQuery(): Record<string, ContentQuery<any>>;
    private addGetQuery;
    private createListQuery;
    static registerQueryPart(fields: EntityFieldMarkers, selection: ContentEntitySelection): ContentEntitySelection;
    private static withMetaField;
}

declare type RootStateNode = EntityRealmState | EntityListState;

export declare type SingleEntityPersistedData = Map<PlaceholderName, EntityFieldPersistedData>;

export declare class StateInitializer {
    private readonly eventManager;
    private readonly treeStore;
    private readonly fieldOperations;
    private readonly entityOperations;
    private readonly listOperations;
    constructor(accessorErrorManager: AccessorErrorManager, batchUpdatesOptions: BatchUpdatesOptions, eventManager: EventManager, treeStore: TreeStore);
    initializeSubTree(tree: EntitySubTreeMarker | EntityListSubTreeMarker): RootStateNode;
    initializeEntityRealm(id: RuntimeId, entityName: EntityName, blueprint: EntityRealmBlueprint, copyFrom?: EntityRealmState | EntityRealmStateStub): EntityRealmState | EntityRealmStateStub;
    private createEntityRealm;
    private materializeEntityRealm;
    private registerEntityRealm;
    initializeEntityState(id: RuntimeId, entityName: EntityName): EntityState;
    private initializeEntityListState;
    private initializeFieldState;
    private initializeFromFieldMarker;
    private initializeFromHasOneRelationMarker;
    private initializeFromHasManyRelationMarker;
    private getRelationTargetEntityName;
    runImmediateUserInitialization(realm: EntityRealmState | EntityRealmStateStub, initialize: EntityAccessor.BatchUpdatesHandler | undefined): void;
    initializeEntityEventListenerStore(blueprint: EntityRealmBlueprint): EntityEventListenerStore | undefined;
    private initializeEntityListEventListenerStore;
    private initializeEntityListChildEventListenerStore;
    private initializeFieldEventListenerStore;
}

declare type StateNode<Value extends FieldValue = any> = EntityRealmState | EntityListState | FieldState<Value>;

declare type SubMutationOperation = {
    alias: string;
    subTreePlaceholder: PlaceholderName;
    subTreeType: 'list' | 'single';
} & ({
    type: 'delete';
    id: EntityId;
} | {
    type: 'update';
    markers: EntityFieldMarkers;
    id: EntityId;
} | {
    type: 'create';
    markers: EntityFieldMarkers;
    id: EntityId;
});

export declare type SubTreeDataStore = Map<PlaceholderName, ServerId | EntityListPersistedData>;

declare interface SubTreeEntityRealmBlueprint {
    readonly type: 'subTree';
    readonly marker: EntitySubTreeMarker;
    readonly parent: undefined;
}

declare class TemporalFieldHelper extends FieldHelper<string> {
    setToNow(options?: FieldAccessor.UpdateOptions): void;
}

declare namespace TemporalFieldHelper {
    const setToNow: (field: FieldAccessor<string> | FieldAccessor.GetFieldAccessor<string>, options?: FieldAccessor.UpdateOptions) => void;
}

export declare class TreeAugmenter {
    private readonly eventManager;
    private readonly stateInitializer;
    private readonly treeStore;
    private readonly skipStateUpdateAfterPersist;
    constructor(eventManager: EventManager, stateInitializer: StateInitializer, treeStore: TreeStore, skipStateUpdateAfterPersist?: boolean);
    extendPersistedData(newPersistedData: ReceivedDataTree, markerTree: MarkerTreeRoot): void;
    extendTreeStates(newTreeId: TreeRootId | undefined, newMarkerTree: MarkerTreeRoot): void;
    updatePersistedData(response: ReceivedDataTree, operations: SubMutationOperation[]): void;
    resetCreatingSubTrees(): void;
    private updateRealmIdIfNecessary;
    private updateEntityRealmPersistedData;
    private updateEntityListPersistedData;
    private tryAssignIdToMatching;
    private isEntityMatching;
    private isEmptyEntity;
}

export declare class TreeStore {
    private readonly _schema;
    readonly entityStore: Map<UniqueEntityId, EntityState>;
    readonly entityRealmStore: Map<EntityRealmKey, EntityRealmState | EntityRealmStateStub>;
    readonly markerTrees: Map<TreeRootId | undefined, MarkerTreeRoot>;
    readonly subTreeStatesByRoot: Map<TreeRootId | undefined, Map<PlaceholderName, RootStateNode>>;
    readonly persistedData: NormalizedPersistedData;
    constructor(_schema: Schema);
    mergeInQueryResponse(response: ReceivedDataTree, markerTree: MarkerTreeRoot): void;
    mergeInMutationResponse(response: ReceivedDataTree, operations: SubMutationOperation[]): void;
    get persistedEntityData(): PersistedEntityDataStore;
    get subTreePersistedData(): SubTreeDataStore;
    get schema(): Schema;
    getPathBackToParent(entityRealm: EntityRealmState | EntityRealmStateStub): {
        fieldBackToParent: FieldName;
        parent: EntityRealmState;
    } | undefined;
    getSubTreeState(mode: 'entity', treeRootId: TreeRootId | undefined, aliasOrParameters: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity, environment: Environment): EntityRealmState;
    getSubTreeState(mode: 'entityList', treeRootId: TreeRootId | undefined, aliasOrParameters: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList, environment: Environment): EntityListState;
    getEntityListPersistedIds(state: EntityListState): ReadonlySet<EntityId>;
    disposeOfRealm(realmToDisposeOf: EntityRealmState | EntityRealmStateStub): void;
    disposeOfEntity(entity: EntityState): void;
    effectivelyHasTreeRoot(candidateRoot: MarkerTreeRoot): boolean;
}

declare interface UpdateMetadata {
    isMutating: boolean;
}

declare class UuidFieldHelper extends FieldHelper<string> {
    setToUuid(options?: FieldAccessor.UpdateOptions): void;
}

declare namespace UuidFieldHelper {
    const setToUuid: (field: FieldAccessor<string> | FieldAccessor.GetFieldAccessor<string>, options?: FieldAccessor.UpdateOptions) => void;
}


export * from "@contember/binding-common";

export { }
