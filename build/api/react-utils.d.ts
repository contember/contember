import { Context } from 'react';
import { DispatchWithoutAction } from 'react';
import { MutableRefObject } from 'react';
import { NamedExoticComponent } from 'react';
import type { Provider } from 'react';
import { ReactNode } from 'react';
import { RefCallback } from 'react';
import { RefObject } from 'react';

export declare type ComposedRefCallback<T> = RefCallback<T> & {
    current: T | null;
};

export declare function createContext<T>(name: string, initialValue: T): [Context<T>, () => T, Provider<T>];

export declare function createRequiredContext<T>(displayName: string): [Context<T>, () => T, Provider<T>];

export declare const DebugChildren: NamedExoticComponent<DebugChildrenProps>;

export declare type DebugChildrenProps = {
    active?: true;
    children: ReactNode;
    id: string;
} | {
    active?: false;
    children: ReactNode;
    id?: string;
};

export declare type DebugMethod = (...parameters: any[]) => void;

export declare const emptyArray: any[];

export declare const emptyObject: Readonly<{}>;

/**
 * Walks through the children and returns a string representation of the text content.
 *
 * @param node - The children to walk through.
 * @returns String representation of the text content or undefined if there is no text content.
 *
 */
export declare function getChildrenAsLabel(node: ReactNode): string | undefined;

/**
 * Retrieves the appropriate storage mechanism based on the provided storage type or custom storage instance.
 * Supports fallback mechanisms when multiple storage options are provided.
 *
 * #### Example: Using a single storage type
 * ```tsx
 * const storage = getStateStorage('local'); // Retrieves localStorage
 * ```
 *
 * #### Example: Using fallback storages
 * ```tsx
 * const storage = getStateStorage(['session', 'local']); // Uses sessionStorage, falls back to localStorage
 * ```
 */
export declare const getStateStorage: (storageOrName: StateStorageOrName | StateStorageOrName[]) => StateStorage;

export declare const identityFunction: <Value>(value: Value) => Value;

export declare function isNoopScopedConsole(value: unknown): boolean;

/**
 * A `StateStorage` instance that persists state using `localStorage`.
 *
 * This storage mechanism automatically serializes and deserializes stored values using JSON.
 * It is useful for storing persistent state that remains available even after closing and reopening the browser.
 *
 * #### Example: Storing a username in local storage
 * ```tsx
 * localStateStorage.setItem(['user', 'name'], 'Alice');
 * console.log(localStateStorage.getItem(['user', 'name'])); // Output: "Alice"
 * ```
 */
export declare const localStateStorage: StateStorage;

export declare type MaybeRef<T> = ((instance: T | null) => void) | MutableRefObject<T | null> | null | undefined;

export declare type NoConstructor<T extends Function> = T extends new (...args: unknown[]) => unknown ? never : T;

export declare const noop: () => undefined;

export declare function noopLog(...parameters: any[]): void;

export declare function noopLogged<T>(message: string, value: T): T;

export declare const noopScopedConsole: ScopedConsoleContextType;

export declare const nullStorage: StateStorage;

export declare type PropsWithRequiredChildren<P = unknown> = P & {
    children: ReactNode | undefined;
};

export declare type RefObjectOrElement<T> = T | RefObject<T>;

export declare type ResultDebuggedMethod = <T>(message: string, value: T) => T;

export declare const returnFalse: () => boolean;

export declare const returnTrue: () => boolean;

export declare const ScopedConsoleContext: Context<ScopedConsoleContextType>;

export declare type ScopedConsoleContextType = {
    log: DebugMethod;
    logged: ResultDebuggedMethod;
    warn: DebugMethod;
    warned: ResultDebuggedMethod;
    error: DebugMethod;
    errored: ResultDebuggedMethod;
    trace: DebugMethod;
    traced: ResultDebuggedMethod;
};

export declare type Serializable = string | number | boolean | null | readonly Serializable[] | {
    readonly [K in string]?: Serializable;
};

/**
 * A `StateStorage` instance that persists state using `sessionStorage`.
 *
 * This storage mechanism automatically serializes and deserializes stored values using JSON.
 * It is useful for storing temporary state that should persist across page reloads but be cleared when the session ends.
 *
 * #### Example: Storing a theme preference in session storage
 * ```tsx
 * sessionStateStorage.setItem(['app', 'theme'], 'dark');
 * console.log(sessionStateStorage.getItem(['app', 'theme'])); // Output: "dark"
 * ```
 */
export declare const sessionStateStorage: StateStorage;

export declare type SetState<V extends Serializable> = (value: V | ((current: V) => V)) => void;

export declare interface StateStorage {
    getItem(key: StateStorageKey): Serializable;
    setItem(key: StateStorageKey, value: Serializable): void;
}

export declare type StateStorageKey = [uniquePrefix: string, key: string];

export declare type StateStorageOrName = StateStorage | 'url' | 'session' | 'local' | 'null';

/**
 * Unwraps a ref object or returns the value if it is not a ref object.
 * @param value - Value to unwrap
 * @returns Unwrapped value
 */
export declare function unwrapRefValue<T>(value: RefObjectOrElement<T>): T | null;

/**
 * `urlStateStorage` is a `StateStorage` implementation that persists state in the URL query parameters.
 * This allows state persistence across page reloads and enables sharing state via URL.
 *
 * #### Example: Storing state in the URL
 * ```tsx
 * urlStateStorage.setItem(['app', 'theme'], 'dark'); // URL updates to: `?theme="dark"`
 * console.log(urlStateStorage.getItem(['app', 'theme'])); // Output: "dark"
 * ```
 */
export declare const urlStateStorage: StateStorage;

export declare const useAbortController: () => () => AbortSignal;

/**
 * ⚠️ ONLY USE THIS IF YOU *REALLY* KNOW WHAT YOU'RE DOING! ⚠️
 * ⚠   HERE BE DRAGONS THAT KNOW WHERE YOU LIVE! ⚠
 *
 * This is a bit of React naughtiness that allows us to memoize outputs of Array.prototype.map() based on the contents
 * of the original array, and not its referential equality. That way, if we create a new array with identical items,
 * we get an array that is referentially equal to the previous one.
 */
export declare const useArrayMapMemo: <Item, OutputItem>(items: Item[], map: (value: Item, index: number, array: Item[]) => OutputItem) => OutputItem[];

export declare const useAutoHeightTextArea: (textAreaRef: RefObjectOrElement<HTMLTextAreaElement>, value: string, minRows: number, maxRows: number) => void;

/**
 * Walks through the children and returns a string representation of the text content.
 *
 * @param node - The children to walk through.
 * @returns String representation of the text content or undefined if there is no text content.
 *
 */
export declare function useChildrenAsLabel(node: ReactNode): string | undefined;

/**
 * Fills any number of refs with an instance
 *
 * Useful when you need to use outer ref and inner in the same time, e.g. passing element
 * back to forwardedRef an also using the same value within the component locally.
 *
 * @param refs - Rest parameter of refs to fill with instance
 * @returns Returns a function similar to a RefCallback
 */
export declare function useComposeRef<T>(...refs: MaybeRef<T>[]): ComposedRefCallback<T>;

export declare const useConstantLengthInvariant: <Item>(items: Item[], message?: string) => void;

export declare const useConstantValueInvariant: <Value>(value: Value, message?: string) => void;

export declare const useDebounce: <T>(value: T, debounceMs: number) => T;

export declare const useDebounceCallback: (cb: () => any, debounceMs: number) => () => void;

export declare function useDocumentTitle(title: string | null | undefined, formatter?: (title: string, initialTitle: string) => string): void;

/**
 * Checks whether the next value is the same reference as the previous one
 *
 * If not, it checks whether the values are deeply equal. If not, it logs an error.
 *
 * @param next - Value to be checked.
 * @param shouldThrow - If true, it throws an error instead of logging it. Defaults to false.
 * @returns void
 * -
 * @example
 * ```ts
 * useExpectSameValueReference(style)
 * ```
 * @example
 * ```ts
 * useExpectSameValueReference(style, true)
 * ```
 * @example
 * ```ts
 * useExpectSameValueReference(style, import.meta.env.DEV)
 * ```
 */
export declare function useExpectSameValueReference<T>(next: T, shouldThrow?: boolean): void;

export declare const useForceRender: () => DispatchWithoutAction;

/**
 * Returns a unique ID string
 * @internal
 *
 * NOTE: This hook is a temporary solution until we stop supporting React < 18
 *
 * @returns a unique id
 */
export declare function useId(): string;

export declare const useIsMounted: () => MutableRefObject<boolean>;

/**
 * `useLocalStorageState` is a specialized hook for persisting state in `localStorage`.
 * It initializes state from `localStorage` on first render and updates it whenever the state changes.
 *
 * #### Example: Persisting username in local storage
 * ```tsx
 * const [username, setUsername] = useLocalStorageState(['user', 'name'], storedValue => storedValue ?? 'Guest');
 *
 * return (
 *   <div>
 *     <p>Username: {username}</p>
 *     <input
 *       type="text"
 *       value={username}
 *       onChange={(e) => setUsername(e.target.value)}
 *       placeholder="Enter your name"
 *     />
 *   </div>
 * );
 * ```
 */
export declare const useLocalStorageState: <V extends Serializable>(key: StateStorageKey, initializeValue: ValueInitializer<V>) => [V, SetState<V>];

export declare const useObjectMemo: <A extends object>(value: A) => A;

export declare function useOnElementClickOutsideCallback(refOrElement: RefObjectOrElement<HTMLElement>, callback: (event: MouseEvent) => void): void;

/**
 * Calls the callback when the mouse enters the element, but only after a timeout, e.g. for tooltips or dropdown menus.
 *
 * Calls the callback immediately if the mouse is pressed down with `event.type` of `mousedown`. This is useful for
 * dropdown menus, where the user may click on the menu item before the callback is called resulting in the menu
 * opening and closing immediately.
 *
 * @param refOrElement - The element or ref to the element to attach the event listener to.
 * @param callback - The callback to call when the mouse enters the element.
 * @param timeoutMs - The timeout in milliseconds to wait before calling the callback.
 */
export declare function useOnElementMouseEnterDelayedCallback(refOrElement: RefObjectOrElement<HTMLElement>, callback: (event: MouseEvent) => void, timeoutMs?: number): void;

export declare function useOnElementResize(refOrElement: RefObjectOrElement<HTMLElement | null> | null, callback: (entries: ResizeObserverEntry) => void, options?: ResizeObserverOptions, timeout?: number): void;

export declare function useOnWindowResize(callback: (event: Event) => void, interval?: number): void;

export declare const usePreviousValue: <Value>(value: Value) => Value;

export declare const useReferentiallyStableCallback: <T extends Function>(callback: NoConstructor<T>) => T;

export declare const useScopedConsoleRef: (prefix: string, override?: boolean) => MutableRefObject<ScopedConsoleContextType>;

/**
 * `useSessionStorageState` is a specialized hook for persisting state in `sessionStorage`.
 * It initializes state from `sessionStorage` on first render and updates it whenever the state changes.
 *
 * #### Example: Persisting theme in session storage
 * ```tsx
 * const [theme, setTheme] = useSessionStorageState(['app', 'theme'], storedValue => storedValue ?? 'light');
 *
 * return (
 *   <div>
 *     <p>Current Theme: {theme}</p>
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Toggle Theme
 *     </button>
 *   </div>
 * );
 * ```
 */
export declare const useSessionStorageState: <V extends Serializable>(key: StateStorageKey, initializeValue: ValueInitializer<V>) => [V, SetState<V>];

/**
 * `useStoredState` provides a persistent state using different storage options such as
 * URL, `sessionStorage`, `localStorage`, or a custom storage mechanism.
 *
 * This hook initializes state from the selected storage and updates it whenever the state changes.
 *
 * #### Example: Using session storage
 * ```tsx
 * const [count, setCount] = useStoredState<number>('session', ['app', 'counter'], storedValue => storedValue ?? 0);
 *
 * return (
 *   <div>
 *     <p>Count: {count}</p>
 *     <button onClick={() => setCount(prev => prev + 1)}>Increment</button>
 *   </div>
 * );
 * ```
 */
export declare const useStoredState: <V extends Serializable>(storageOrName: StateStorageOrName | StateStorageOrName[], key: StateStorageKey, initializeValue: ValueInitializer<V>) => [V, SetState<V>];

/**
 * Returns a stable mutable object with value that is updated upon each call
 *
 * @param value - Value that could update after initial call
 * @returns Mutable ref object with updated value
 */
export declare function useUpdatedRef<T>(value: T): MutableRefObject<T>;

export declare function useWindowSize(): {
    height: number;
    width: number;
};

export declare type ValueInitializer<V extends Serializable> = (storedValue: V | undefined) => V;

export { }
