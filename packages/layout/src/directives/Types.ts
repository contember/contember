import { DeepPartial } from '@contember/utilities'
import { FunctionComponent, PropsWithChildren } from 'react'

export type KeyValuePair<T, K extends keyof T = keyof T> = { key: K, value: T[K] }
export type SetDirectiveContextType<T extends Record<string, unknown>> = {
	registerDirective: <K extends keyof T>(componentId: string, key: K, value: T[K]) => void,
	updateDirective: <K extends keyof T>(componentId: string, key: K, value: T[K]) => void,
	unregisterDirective: (componentId: string) => void,
}

export type Literal = string | number | boolean | null | undefined

export type DirectiveComponentTypeProps<V> = V extends Literal ? { children: V } : PropsWithChildren<DeepPartial<V>>
export type DirectiveComponentType<V> = FunctionComponent<DirectiveComponentTypeProps<V>>

export type RequiredDeepPlainObject<T extends Record<string, unknown>, K extends keyof T & string = keyof T & string> = {
	[P in K]-?: T[P] extends Record<string, unknown> ? RequiredDeepPlainObject<T[P]> : T[P]
}

export type DirectiveProps<T extends Record<string, unknown>, K extends keyof T & string = keyof T & string> = {
	name: K;
	content: T[K];
}
