declare namespace React {
	// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/52873#issuecomment-955022625
	export type NoConstructor<T extends Function> =
		T extends new (...args: unknown[]) => unknown
			? never
			: T

	declare function useCallback<T extends Function>(
		callback: NoConstructor<T>,
		deps: DependencyList,
	): T;
}
