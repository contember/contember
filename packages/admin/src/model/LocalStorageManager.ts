export type LocalStorageManagerKeys = 'api_identity'

export class LocalStorageManager {
	get(key: LocalStorageManagerKeys) {
		return localStorage.getItem(key)
	}

	set(key: LocalStorageManagerKeys, value: string) {
		return localStorage.setItem(key, value)
	}

	unset(key: LocalStorageManagerKeys) {
		return localStorage.removeItem(key)
	}
}
