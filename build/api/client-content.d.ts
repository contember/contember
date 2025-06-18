import { GraphQlClient } from '@contember/graphql-client';
import { GraphQlClientRequestOptions } from '@contember/graphql-client';
import { GraphQlFieldTypedArgs } from '@contember/graphql-builder';
import { GraphQlFragment } from '@contember/graphql-builder';
import { GraphQlSelectionSet } from '@contember/graphql-builder';
import { Input } from '@contember/schema';
import { JSONObject } from '@contember/schema';
import { Result } from '@contember/schema';

export declare class ContentClient {
    private readonly client;
    constructor(client: Pick<GraphQlClient, 'execute'>);
    query<Value>(query: ContentQuery<Value>, options?: QueryExecutorOptions): Promise<Value>;
    query<Values extends Record<string, any>>(queries: {
        [K in keyof Values]: ContentQuery<Values[K]>;
    }, options?: QueryExecutorOptions): Promise<Values>;
    mutate<Value>(mutation: ContentMutation<Value>, options?: QueryExecutorOptions): Promise<Value>;
    mutate<Value>(mutations: ContentMutation<Value>[], options?: QueryExecutorOptions): Promise<Value[]>;
    mutate<Values extends Record<string, any>>(mutations: {
        [K in keyof Values]: ContentMutation<Values[K]> | ContentQuery<Values[K]>;
    }, options?: QueryExecutorOptions): Promise<Values>;
}

export declare namespace ContentClientInput {
    export type ConnectRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly connect: UniqueWhere<TEntity>;
    };
    export type CreateRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly create: CreateDataInput<TEntity>;
    };
    export type ConnectOrCreateInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly connect: UniqueWhere<TEntity>;
        readonly create: CreateDataInput<TEntity>;
    };
    export type ConnectOrCreateRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly connectOrCreate: ConnectOrCreateInput<TEntity>;
    };
    export type DisconnectSpecifiedRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly disconnect: UniqueWhere<TEntity>;
    };
    export type DeleteSpecifiedRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly delete: UniqueWhere<TEntity>;
    };
    export type UpdateSpecifiedRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly update: {
            readonly by: UniqueWhere<TEntity>;
            readonly data: UpdateDataInput<TEntity>;
        };
    };
    export type UpsertSpecifiedRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly upsert: {
            readonly by: UniqueWhere<TEntity>;
            readonly update: UpdateDataInput<TEntity>;
            readonly create: CreateDataInput<TEntity>;
        };
    };
    export type DisconnectRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly disconnect: true;
    };
    export type UpdateRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly update: UpdateDataInput<TEntity>;
    };
    export type DeleteRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly delete: true;
    };
    export type UpsertRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly upsert: {
            readonly update: UpdateDataInput<TEntity>;
            readonly create: CreateDataInput<TEntity>;
        };
    };
    export type CreateDataInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
    } & {
        readonly [key in keyof TEntity['columns']]?: TEntity['columns'][key];
    } & {
        readonly [key in keyof TEntity['hasMany']]?: CreateManyRelationInput<TEntity['hasMany'][key]>;
    } & {
        readonly [key in keyof TEntity['hasOne']]?: CreateOneRelationInput<TEntity['hasOne'][key]>;
    };
    export type CreateOneRelationInput<TEntity extends EntityTypeLike> = ConnectRelationInput<TEntity> | CreateRelationInput<TEntity> | ConnectOrCreateRelationInput<TEntity>;
    export type CreateManyRelationInput<TEntity extends EntityTypeLike> = readonly CreateOneRelationInput<TEntity>[];
    export type UpdateDataInput<TEntity extends EntityTypeLike> = {
        /**
         * @internal
         */
        readonly __typeGuard?: TEntity['name'];
    } & {
        readonly [key in keyof TEntity['columns']]?: TEntity['columns'][key];
    } & {
        readonly [key in keyof TEntity['hasMany']]?: UpdateManyRelationInput<TEntity['hasMany'][key]>;
    } & {
        readonly [key in keyof TEntity['hasOne']]?: UpdateOneRelationInput<TEntity['hasOne'][key]>;
    };
    export type UpdateInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly by: UniqueWhere<TEntity>;
        readonly filter?: Where<TEntity>;
        readonly data: UpdateDataInput<TEntity>;
    };
    export type UpsertInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly by: UniqueWhere<TEntity>;
        readonly filter?: Where<TEntity>;
        readonly update: UpdateDataInput<TEntity>;
        readonly create: CreateDataInput<TEntity>;
    };
    export type CreateInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly data: CreateDataInput<TEntity>;
    };
    export type DeleteInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly by: UniqueWhere<TEntity>;
        readonly filter?: Where<TEntity>;
    };
    export type UniqueQueryInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly by: UniqueWhere<TEntity>;
        readonly filter?: Where<TEntity>;
    };
    export type ListQueryInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly filter?: Where<TEntity>;
        readonly orderBy?: readonly OrderBy<TEntity>[];
        readonly offset?: number;
        readonly limit?: number;
    };
    export type PaginationQueryInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly filter?: Where<TEntity>;
        readonly orderBy?: readonly OrderBy<TEntity>[];
        readonly skip?: number;
        readonly first?: number;
    };
    export type HasOneRelationInput<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly filter?: Where<TEntity>;
    };
    export type HasManyByRelationInput<TEntity extends EntityTypeLike, TUnique extends JSONObject> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly by: TUnique;
        readonly filter?: Where<TEntity>;
    };
    export type HasManyRelationInput<TEntity extends EntityTypeLike> = ListQueryInput<TEntity>;
    export type HasManyRelationPaginateInput<TEntity extends EntityTypeLike> = PaginationQueryInput<TEntity>;
    export type UpdateOneRelationInput<TEntity extends EntityTypeLike> = CreateRelationInput<TEntity> | ConnectRelationInput<TEntity> | ConnectOrCreateRelationInput<TEntity> | DeleteRelationInput<TEntity> | DisconnectRelationInput<TEntity> | UpdateRelationInput<TEntity> | UpsertRelationInput<TEntity>;
    export type UpdateManyRelationInputItem<TEntity extends EntityTypeLike> = CreateRelationInput<TEntity> | ConnectRelationInput<TEntity> | ConnectOrCreateRelationInput<TEntity> | DeleteSpecifiedRelationInput<TEntity> | DisconnectSpecifiedRelationInput<TEntity> | UpdateSpecifiedRelationInput<TEntity> | UpsertSpecifiedRelationInput<TEntity>;
    export type UpdateManyRelationInput<TEntity extends EntityTypeLike> = Array<UpdateManyRelationInputItem<TEntity>>;
    export type FieldOrderBy<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
    } & {
        readonly [key in keyof TEntity['columns']]?: `${Input.OrderDirection}` | null;
    } & {
        readonly [key in keyof TEntity['hasOne']]?: FieldOrderBy<TEntity['hasOne'][key]> | null;
    };
    export type OrderBy<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly _random?: boolean;
        readonly _randomSeeded?: number;
    } & FieldOrderBy<TEntity>;
    export type UniqueWhere<TEntity extends EntityTypeLike> = {
        /**
         * @internal
         */
        readonly __typeGuard?: TEntity['name'];
    } & TEntity['unique'];
    export type Where<TEntity extends EntityTypeLike> = {
        /** @internal */
        readonly __typeGuard?: TEntity['name'];
        readonly and?: (readonly (Where<TEntity>)[]) | null;
        readonly or?: (readonly (Where<TEntity>)[]) | null;
        readonly not?: Where<TEntity> | null;
    } & {
        readonly [key in keyof TEntity['columns']]?: Input.Condition<TEntity['columns'][key]> | null;
    } & {
        readonly [key in keyof TEntity['hasMany']]?: Where<TEntity['hasMany'][key]> | null;
    } & {
        readonly [key in keyof TEntity['hasOne']]?: Where<TEntity['hasOne'][key]> | null;
    };
    export type AnyOrderBy = Input.OrderBy<`${Input.OrderDirection}`>[];
    export type AnyListQueryInput = Omit<Input.ListQueryInput, 'orderBy'> & {
        readonly orderBy?: AnyOrderBy;
    };
}

export declare class ContentEntitySelection {
    /** @internal */
    readonly context: ContentEntitySelectionContext<string>;
    /** @internal */
    readonly selectionSet: GraphQlSelectionSet;
    /** @internal */
    readonly transformFn?: ((value: any, ctx: ContentTransformContext) => any) | undefined;
    /**
     * @internal
     */
    constructor(
    /** @internal */
    context: ContentEntitySelectionContext<string>, 
    /** @internal */
    selectionSet: GraphQlSelectionSet, 
    /** @internal */
    transformFn?: ((value: any, ctx: ContentTransformContext) => any) | undefined);
    $(field: string, args?: EntitySelectionColumnArgs): ContentEntitySelection;
    $(field: string, args: EntitySelectionManyArgs, selection: ContentEntitySelectionOrCallback): ContentEntitySelection;
    $(field: string, args: EntitySelectionManyByArgs, selection: ContentEntitySelectionOrCallback): ContentEntitySelection;
    $(field: string, args: EntitySelectionOneArgs, selection: ContentEntitySelectionOrCallback): ContentEntitySelection;
    $(field: string, selection: ContentEntitySelectionOrCallback): ContentEntitySelection;
    $$(): ContentEntitySelection;
    omit(...fields: string[]): ContentEntitySelection;
    meta(field: string, flags: ('readable' | 'updatable')[]): ContentEntitySelection;
    transform(transform: (value: any, context: ContentTransformContext) => any): ContentEntitySelection;
    private _column;
    private _many;
    private _manyBy;
    private _one;
    private withField;
    private withFieldTransform;
}

export declare type ContentEntitySelectionCallback = (select: ContentEntitySelection) => ContentEntitySelection;

/**
 * @internal
 */
export declare type ContentEntitySelectionContext<Name extends string> = {
    entity: SchemaEntityNames<Name>;
    schema: SchemaNames;
};

export declare type ContentEntitySelectionOrCallback = ContentEntitySelectionCallback | ContentEntitySelection;

export declare type ContentMutation<TValue> = ContentOperation<TValue, 'mutation'>;

export declare class ContentOperation<TValue, TType extends 'query' | 'mutation'> {
    /** @internal */
    readonly type: TType;
    /** @internal */
    readonly fieldName: string;
    /** @internal */
    readonly args: GraphQlFieldTypedArgs;
    /** @internal */
    readonly selection?: GraphQlSelectionSet | undefined;
    /** @internal */
    readonly parse: (value: any) => TValue;
    /**
     * @internal
     */
    constructor(
    /** @internal */
    type: TType, 
    /** @internal */
    fieldName: string, 
    /** @internal */
    args?: GraphQlFieldTypedArgs, 
    /** @internal */
    selection?: GraphQlSelectionSet | undefined, 
    /** @internal */
    parse?: (value: any) => TValue);
}

export declare type ContentQuery<TValue> = ContentOperation<TValue, 'query'>;

export declare class ContentQueryBuilder {
    private readonly schema;
    constructor(schema: SchemaNames);
    fragment(name: string, fieldsCallback?: ContentEntitySelectionCallback): ContentEntitySelection;
    count(name: string, args: Pick<ContentClientInput.AnyListQueryInput, 'filter'>): ContentQuery<number>;
    list(name: string, args: ContentClientInput.AnyListQueryInput, fields: EntitySelectionOrCallback): ContentQuery<any[]>;
    get(name: string, args: Input.UniqueQueryInput, fields: EntitySelectionOrCallback): ContentQuery<Record<string, unknown> | null>;
    create(name: string, args: Input.CreateInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult>;
    update(name: string, args: Input.UpdateInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult>;
    upsert(name: string, args: Input.UpsertInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult>;
    delete(name: string, args: Input.UniqueQueryInput, fields?: EntitySelectionOrCallback): ContentMutation<MutationResult>;
    private createMutationOperation;
    transaction(input: Record<string, ContentMutation<any> | ContentQuery<any>> | ContentMutation<any> | ContentMutation<any>[], options?: MutationTransactionOptions): ContentMutation<TransactionResult<any>>;
    private createMutationSelection;
    private resolveSelection;
    private createContext;
    private getEntity;
}

export declare type ContentTransformContext = {
    rootValue: unknown;
};

export declare type EntitySelectionAnyArgs = EntitySelectionColumnArgs | EntitySelectionManyArgs | EntitySelectionManyByArgs | EntitySelectionOneArgs;

export declare type EntitySelectionColumnArgs<Alias extends string | null = string | null> = EntitySelectionCommonInput<Alias>;

export declare type EntitySelectionCommonInput<Alias extends string | null = string | null> = {
    as?: Alias;
};

export declare type EntitySelectionManyArgs<Alias extends string | null = string | null> = ContentClientInput.AnyListQueryInput & EntitySelectionCommonInput<Alias>;

export declare type EntitySelectionManyByArgs<Alias extends string | null = string | null> = {
    by: Input.UniqueWhere;
    filter?: Input.Where;
} & EntitySelectionCommonInput<Alias>;

export declare type EntitySelectionOneArgs<Alias extends string | null = string | null> = {
    filter?: Input.Where;
} & EntitySelectionCommonInput<Alias>;

export declare type EntitySelectionOrCallback = ContentEntitySelection | ContentEntitySelectionCallback;

export declare type EntityTypeLike = {
    name: string;
    unique: JSONObject;
    columns: {
        [columnName: string]: any;
    };
    hasOne: {
        [relationName: string]: any;
    };
    hasMany: {
        [relationName: string]: any;
    };
    hasManyBy: {
        [relationName: string]: {
            entity: any;
            by: JSONObject;
        };
    };
};

export declare type FieldPath = {
    readonly field: string;
};

export declare type IndexPath = {
    readonly index: number;
    readonly alias: string | null;
};

export declare type MutationError = {
    readonly paths: Path[];
    readonly message: string;
    readonly type: Result.ExecutionErrorType;
};

export declare const mutationFragments: Record<string, GraphQlFragment>;

export declare type MutationResult<Value = unknown> = {
    readonly ok: boolean;
    readonly errorMessage: string | null;
    readonly errors: MutationError[];
    readonly node: Value | null;
    readonly validation?: ValidationResult;
};

export declare type MutationTransactionOptions = {
    deferForeignKeyConstraints?: boolean;
    deferUniqueConstraints?: boolean;
};

export declare type Path = Array<FieldPath | IndexPath>;

export declare type QueryExecutorOptions = GraphQlClientRequestOptions;

export declare type SchemaEntityNames<Name extends string> = {
    readonly name: Name;
    readonly scalars: readonly string[];
    readonly fields: {
        readonly [fieldName: string]: {
            readonly type: 'column';
        } | {
            readonly type: 'many' | 'one';
            readonly entity: string;
        };
    };
};

export declare type SchemaNames = {
    readonly entities: {
        readonly [entityName: string]: SchemaEntityNames<string>;
    };
    readonly enums: {
        readonly [enumName: string]: readonly string[];
    };
};

export declare type SchemaTypeLike = {
    entities: {
        [entityName: string]: EntityTypeLike;
    };
};

export declare type TransactionResult<V> = {
    readonly ok: boolean;
    readonly errorMessage: string | null;
    readonly errors: MutationError[];
    readonly validation: ValidationResult;
    readonly data: V;
};

export declare type TypedColumnArgs<TAlias extends string | null = null> = {
    as?: TAlias;
};

export declare type TypedColumnParams<TAlias extends string | null = null> = [
args: TypedColumnArgs<TAlias>
] | [];

export declare type TypedContentEntitySelectionOrCallback<TSchema extends SchemaTypeLike, TEntityName extends keyof TSchema['entities'] & string, TValue> = TypedEntitySelection<TSchema, TEntityName, TSchema['entities'][TEntityName], TValue> | TypedEntitySelectionCallback<TSchema, TEntityName, TSchema['entities'][TEntityName], TValue>;

export declare interface TypedContentQueryBuilder<TSchema extends SchemaTypeLike> {
    fragment<EntityName extends keyof TSchema['entities'] & string>(name: EntityName): TypedEntitySelection<TSchema, EntityName, TSchema['entities'][EntityName], {}>;
    fragment<EntityName extends keyof TSchema['entities'] & string, TFields>(name: EntityName, fieldsCallback: TypedEntitySelectionCallback<TSchema, EntityName, TSchema['entities'][EntityName], TFields>): TypedEntitySelection<TSchema, EntityName, TSchema['entities'][EntityName], TFields>;
    count<EntityName extends keyof TSchema['entities'] & string>(name: EntityName, args: Pick<ContentClientInput.ListQueryInput<TSchema['entities'][EntityName]>, 'filter'>): ContentQuery<number>;
    list<EntityName extends keyof TSchema['entities'] & string, TValue>(name: EntityName, args: ContentClientInput.ListQueryInput<TSchema['entities'][EntityName]>, fields: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>): ContentQuery<TValue[]>;
    get<EntityName extends keyof TSchema['entities'] & string, TValue>(name: EntityName, args: ContentClientInput.UniqueQueryInput<TSchema['entities'][EntityName]>, fields: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>): ContentQuery<TValue | null>;
    create<EntityName extends keyof TSchema['entities'] & string, TValue>(name: EntityName, args: ContentClientInput.CreateInput<TSchema['entities'][EntityName]>, fields?: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>): ContentMutation<MutationResult<TValue>>;
    update<EntityName extends keyof TSchema['entities'] & string, TValue>(name: EntityName, args: ContentClientInput.UpdateInput<TSchema['entities'][EntityName]>, fields?: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>): ContentMutation<MutationResult<TValue>>;
    upsert<EntityName extends keyof TSchema['entities'] & string, TValue>(name: EntityName, args: ContentClientInput.UpsertInput<TSchema['entities'][EntityName]>, fields?: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>): ContentMutation<MutationResult<TValue>>;
    delete<EntityName extends keyof TSchema['entities'] & string, TValue>(name: EntityName, args: ContentClientInput.UniqueQueryInput<TSchema['entities'][EntityName]>, fields?: TypedContentEntitySelectionOrCallback<TSchema, EntityName, TValue>): ContentMutation<MutationResult<TValue>>;
    transaction<Value>(mutation: ContentMutation<Value>, options?: MutationTransactionOptions): ContentMutation<TransactionResult<Value>>;
    transaction<Value>(mutations: ContentMutation<Value>[], options?: MutationTransactionOptions): ContentMutation<TransactionResult<Value[]>>;
    transaction<Values extends Record<string, any>>(mutations: {
        [K in keyof Values]: ContentMutation<Values[K]> | ContentQuery<Values[K]>;
    }, options?: MutationTransactionOptions): ContentMutation<TransactionResult<Values>>;
}

export declare interface TypedEntitySelection<TSchema extends SchemaTypeLike, TEntityName extends string, TEntity extends EntityTypeLike, TValue> {
    /** @internal */
    readonly context: ContentEntitySelectionContext<TEntityName>;
    $$(): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
        [key in keyof TEntity['columns']]: TEntity['columns'][key];
    }>;
    transform<T>(cb: (value: TValue) => T): TypedEntitySelection<TSchema, TEntityName, TEntity, T>;
    $<TNestedValue, TKey extends (keyof TEntity['columns'] | keyof TEntity['hasMany'] | keyof TEntity['hasManyBy'] | keyof TEntity['hasOne']) & string, TAlias extends string | null = null>(name: TKey, ...args: TypedEntitySelectionParams<TSchema, TEntity, TKey, TNestedValue, TAlias>): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue & {
        [key in TAlias extends null ? TKey : TAlias]: TypedEntitySelectionResult<TEntity, TKey, TNestedValue>;
    }>;
    omit<TField extends keyof TValue>(...fields: TField[]): TypedEntitySelection<TSchema, TEntityName, TEntity, Omit<TValue, TField>>;
    meta<TField extends (keyof TEntity['columns'] | keyof TEntity['hasMany'] | keyof TEntity['hasOne'])>(field: TField, flags: ('readable' | 'updatable')[]): TypedEntitySelection<TSchema, TEntityName, TEntity, TValue>;
}

export declare type TypedEntitySelectionCallback<TSchema extends SchemaTypeLike, EntityName extends string, TEntity extends EntityTypeLike, TValue> = (select: TypedEntitySelection<TSchema, EntityName, TEntity, {}>) => TypedEntitySelection<TSchema, EntityName, TEntity, TValue>;

export declare type TypedEntitySelectionParams<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends string, TNestedValue, TAlias extends string | null = null> = TKey extends keyof TEntity['columns'] ? TypedColumnParams<TAlias> : TKey extends keyof TEntity['hasMany'] ? TypedHasManyParams<TSchema, TEntity, TKey, TNestedValue, TAlias> : TKey extends keyof TEntity['hasManyBy'] ? TypedHasManyByParams<TSchema, TEntity, TKey, TNestedValue, TAlias> : TKey extends keyof TEntity['hasOne'] ? TypedHasOneParams<TSchema, TEntity, TKey, TNestedValue, TAlias> : never;

export declare type TypedEntitySelectionResult<TEntity extends EntityTypeLike, TKey extends string, TValue> = TKey extends keyof TEntity['columns'] ? TEntity['columns'][TKey] : TKey extends keyof TEntity['hasMany'] ? TValue[] : TKey extends keyof TEntity['hasManyBy'] ? null | TValue : TKey extends keyof TEntity['hasOne'] ? null | TValue : never;

export declare type TypedHasManyArgs<TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasMany'] & string, TAlias extends string | null = null> = ContentClientInput.HasManyRelationInput<TEntity['hasMany'][TKey]> & {
    as?: TAlias;
};

export declare type TypedHasManyByArgs<TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasManyBy'] & string, TAlias extends string | null = null> = ContentClientInput.HasManyByRelationInput<TEntity['hasManyBy'][TKey]['entity'], TEntity['hasManyBy'][TKey]['by']> & {
    as?: TAlias;
};

export declare type TypedHasManyByFields<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasManyBy'] & string, TNestedValue> = TypedEntitySelectionCallback<TSchema, TEntity['hasManyBy'][TKey]['entity']['name'], TEntity['hasManyBy'][TKey]['entity'], TNestedValue> | TypedEntitySelection<TSchema, TEntity['hasManyBy'][TKey]['entity']['name'], TEntity['hasManyBy'][TKey]['entity'], TNestedValue>;

export declare type TypedHasManyByParams<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasManyBy'] & string, TNestedValue, TAlias extends string | null = null> = [
args: TypedHasManyByArgs<TEntity, TKey, TAlias>,
fields: TypedHasManyByFields<TSchema, TEntity, TKey, TNestedValue>
];

export declare type TypedHasManyFields<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasMany'] & string, TNestedValue> = TypedEntitySelectionCallback<TSchema, TEntity['hasMany'][TKey]['name'], TEntity['hasMany'][TKey], TNestedValue> | TypedEntitySelection<TSchema, TEntity['hasMany'][TKey]['name'], TEntity['hasMany'][TKey], TNestedValue>;

export declare type TypedHasManyParams<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasMany'] & string, TNestedValue, TAlias extends string | null = null> = [
args: TypedHasManyArgs<TEntity, TKey, TAlias>,
fields: TypedHasManyFields<TSchema, TEntity, TKey, TNestedValue>
] | [
fields: TypedHasManyFields<TSchema, TEntity, TKey, TNestedValue>
];

export declare type TypedHasOneArgs<TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasOne'] & string, TAlias extends string | null = null> = ContentClientInput.HasOneRelationInput<TEntity['hasOne'][TKey]> & {
    as?: TAlias;
};

export declare type TypedHasOneFields<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasOne'] & string, TNestedValue> = TypedEntitySelectionCallback<TSchema, TEntity['hasOne'][TKey]['name'], TEntity['hasOne'][TKey], TNestedValue> | TypedEntitySelection<TSchema, TEntity['hasOne'][TKey]['name'], TEntity['hasOne'][TKey], TNestedValue>;

export declare type TypedHasOneParams<TSchema extends SchemaTypeLike, TEntity extends EntityTypeLike, TKey extends keyof TEntity['hasOne'] & string, TNestedValue, TAlias extends string | null = null> = [
args: TypedHasOneArgs<TEntity, TKey, TAlias>,
fields: TypedHasOneFields<TSchema, TEntity, TKey, TNestedValue>
] | [
fields: TypedHasOneFields<TSchema, TEntity, TKey, TNestedValue>
];

export declare type ValidationError = {
    readonly path: Path;
    readonly message: {
        text: string;
    };
};

export declare type ValidationResult = {
    readonly valid: boolean;
    readonly errors: ValidationError[];
};

export { }
