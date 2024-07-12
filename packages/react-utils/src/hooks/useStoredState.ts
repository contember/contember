import { useCallback, useMemo, useState } from 'react'
import { Serializable } from '../types'

export type SetState<V extends Serializable> = (value: V | ((current: V) => V)) => void;
export type StateStorageKey = [uniquePrefix: string, key: string]

export type ValueInitializer<V extends Serializable> = (storedValue: V | undefined) => V;

export interface StateStorage {
	getItem(key: StateStorageKey): Serializable

	setItem(key: StateStorageKey, value: Serializable): void
}


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

export const sessionStateStorage = createStateStorageFromNativeStorage(() => sessionStorage)
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

export const useSessionStorageState = <V extends Serializable>(key: StateStorageKey, initializeValue: ValueInitializer<V>): [V, SetState<V>] => {
	return useStoredState<V>(sessionStateStorage, key, initializeValue)
}

export const useLocalStorageState = <V extends Serializable>(key: StateStorageKey, initializeValue: ValueInitializer<V>): [V, SetState<V>] => {
	return useStoredState<V>(localStateStorage, key, initializeValue)
}

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
