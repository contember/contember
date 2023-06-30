export type RegistryContextType<T extends Record<string, unknown>> = {
	register: (<K extends keyof T>(key: K, componentId: string, value: T[K]) => void) | undefined;
	update: (<K extends keyof T>(key: K, componentId: string, value: T[K]) => void) | undefined;
	unregister: (<K extends keyof T>(key: K, componentId: string) => void) | undefined;
}
