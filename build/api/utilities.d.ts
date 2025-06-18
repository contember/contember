export declare function assertNever(_: never): never;

export declare class BijectiveIndexedMap<K, V> implements Map<K, V> {
    private readonly valueStore;
    private readonly index;
    private indexSeed;
    private readonly inverse;
    readonly [Symbol.toStringTag] = "BijectiveIndexedMap";
    constructor(originalMap: BijectiveIndexedMap<K, V>);
    constructor(inverse: (value: V) => K);
    private getNewIndex;
    get size(): number;
    clear(): void;
    delete(key: K): boolean;
    forEach(callback: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
    changeKey(oldKey: K, newKey: K): this;
    changeKeyOrder(newOrder: Iterable<K>): void;
    [Symbol.iterator](): MapIterator<[K, V]>;
    entries(): MapIterator<[K, V]>;
    keys(): MapIterator<K>;
    values(): MapIterator<V>;
}

export declare function dataAttribute(value: boolean | null | undefined): '' | undefined;

export declare function dataAttribute<const T extends string>(value: T): T;

export declare function dataAttribute(value: boolean | string | number | undefined | null): string | undefined;

/**
 * Logs a deprecation warning if the assertion is `false`.
 * @internal
 *
 * @param removal - Version when the deprecated feature will be removed
 * @param condition - Condition under which the deprecation warning will be logged
 * @param deprecated - Name of the deprecated feature
 * @param replacement - Name of the feature that replaces the deprecated feature
 *
 * @example
 * ```ts
 * const { visible } = props
 * deprecate(visible !== 'default', '1.3.0', '"default"', '"hidden"')
 * // Logs: Use of "default" is deprecated and might be removed in the next release. Use "hidden" instead.
 * ```
 */
export declare function deprecate(removal: SemverString, condition: boolean, deprecated: string, replacement: string | null): void;

export declare class LRUCache<Key, Value> {
    private readonly maxSize;
    private readonly cache;
    constructor(maxSize: number);
    get(key: Key): Value | undefined;
    set(key: Key, value: Value): void;
    private getOldestKey;
}

export declare type SemverString = `${number}.${number}.${number}`;

export declare interface SvgSizeProps {
    width: number;
    height: number;
    viewBox: string;
}

export declare function svgSizeProps(width: number, height?: number, crop?: number): SvgSizeProps;

export declare class WeakIdCache<K extends object> {
    private readonly cache;
    private seed;
    private readonly rootId;
    getId(key: K): string;
    getOptionalKeyId(key: K | undefined): string;
    private seedToId;
}

export { }
