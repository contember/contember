import { useCallback, useMemo, useState } from 'react'
import { Serializable } from '../types'

export type SetState<V extends Serializable> = (value: V | ((current: V) => V)) => void
export type StateStorageKey = [uniquePrefix: string, key: string]

export type ValueInitializer<V extends Serializable> = (storedValue: V | undefined) => V

export interface StateStorage {
	getItem(key: StateStorageKey): Serializable

	setItem(key: StateStorageKey, value: Serializable): void
}

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
export const urlStateStorage: StateStorage = {
	getItem(key) {
		const searchParams = new URLSearchParams(window.location.search)
		const value = searchParams.get(key[1])
		return value !== null && value !== undefined ? JSON.parse(value) : null
	},
	setItem(key, value) {
		const searchParams = new URLSearchParams(window.location.search)
		searchParams.set(key[1], JSON.stringify(value))
		const newUrl = `${window.location.pathname}?${searchParams.toString()}`
		window.history.replaceState({}, '', newUrl)
	},
}

const createStateStorageFromNativeStorage = (getStorage: () => Storage): StateStorage => {
	return {
		getItem(key) {
			const value = getStorage().getItem(key.join('-'))
			return value !== null ? JSON.parse(value) : null
		},
		setItem(key, value) {
			getStorage().setItem(key.join('-'), JSON.stringify(value))
		},
	}
}

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
export const sessionStateStorage = createStateStorageFromNativeStorage(() => sessionStorage)

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
export const localStateStorage = createStateStorageFromNativeStorage(() => localStorage)

export const nullStorage: StateStorage = {
	getItem() {
		return null
	},
	setItem() {
	},
}

const builtInStorages = {
	url: urlStateStorage,
	session: sessionStateStorage,
	local: localStateStorage,
	null: nullStorage,
}

export type StateStorageOrName = StateStorage | 'url' | 'session' | 'local' | 'null'

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
export const useStoredState = <V extends Serializable>(storageOrName: StateStorageOrName | StateStorageOrName[], key: StateStorageKey, initializeValue: ValueInitializer<V>): [V, SetState<V>] => {
	const storage = useMemo(() => {
		return getStateStorage(storageOrName)
	}, [storageOrName])

	const [value, setValue] = useState<V>(() => {
		const value = storage.getItem(key)
		return initializeValue(value as V)
	})
	return [
		value,
		useCallback(value => {
			setValue(current => {
				const newValue = typeof value === 'function' ? (value as (current: V) => V)(current) : value
				storage.setItem(key, newValue)
				return newValue
			})
		}, [key, storage]),
	]
}

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
export const useSessionStorageState = <V extends Serializable>(key: StateStorageKey, initializeValue: ValueInitializer<V>): [V, SetState<V>] => {
	return useStoredState<V>(sessionStateStorage, key, initializeValue)
}

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
export const useLocalStorageState = <V extends Serializable>(key: StateStorageKey, initializeValue: ValueInitializer<V>): [V, SetState<V>] => {
	return useStoredState<V>(localStateStorage, key, initializeValue)
}

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
export const getStateStorage = (storageOrName: StateStorageOrName | StateStorageOrName[]) => {
	if (Array.isArray(storageOrName)) {
		return createFallbackStorage(storageOrName.map(it => typeof it === 'string' ? builtInStorages[it] : it))
	}
	return typeof storageOrName === 'string' ? builtInStorages[storageOrName] : storageOrName
}


const createFallbackStorage = (storageTypes: StateStorage[]): StateStorage => {
	return {
		getItem(key) {
			for (const storage of storageTypes) {
				const value = storage.getItem(key)
				if (value !== null) {
					return value
				}
			}
			return null
		},
		setItem(key, value) {
			for (const storage of storageTypes) {
				storage.setItem(key, value)
			}
		},
	}
}
