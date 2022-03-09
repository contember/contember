import { useCallback, useState } from 'react'
import { Serializable } from '../types'

type SetState<V extends Serializable> = (value: V | ((current: V) => V)) => void;
type ValueInitializer<V extends Serializable> = (storedValue: V | undefined) => V;

const createStoredStateHook = (getStorage: () => Storage) => {
	return <V extends Serializable>(key: string, initializeValue: ValueInitializer<V>): [V, SetState<V>] => {
		const storage = getStorage()
		const [value, setValue] = useState<V>(() => {
			const value = storage.getItem(key)
			const parsedValue: V | undefined = value !== null ? JSON.parse(value) : undefined
			return initializeValue(parsedValue)
		})
		return [value, useCallback(value => {
			setValue(current => {
				const newValue = typeof value === 'function' ? (value as (current: V) => V)(current) : value
				storage.setItem(key, JSON.stringify(newValue))
				return newValue
			})
		}, [key, storage])]
	}

}

export const useSessionStorageState = createStoredStateHook(() => sessionStorage)
