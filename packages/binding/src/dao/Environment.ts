import * as React from 'react'

class Environment {
	private readonly names: Environment.NameStore

	public constructor(names: Environment.NameStore = Environment.defaultNameStore) {
		this.names = {
			...Environment.defaultNameStore,
			...names,
		}
	}

	public static create(delta: Partial<Environment.NameStore> = {}) {
		return new Environment({
			...Environment.defaultSystemVariables,
			dimensions: {},
		}).putDelta(delta)
	}

	public hasName(name: keyof Environment.NameStore): boolean {
		return name in this.names
	}

	public hasDimension(dimensionName: keyof Environment.SelectedDimensions): boolean {
		return dimensionName in this.names.dimensions
	}

	public getValueOrElse<F, V extends Environment.Value = Environment.Value>(
		name: keyof Environment.NameStore,
		fallback: F,
	): V | F {
		if (!this.hasName(name)) {
			return fallback
		}
		return this.names[name] as V
	}

	public getDimensionOrElse<F>(dimensionName: keyof Environment.SelectedDimensions, fallback: F): string[] | F {
		if (!this.hasDimension(dimensionName)) {
			return fallback
		}
		return this.names.dimensions[dimensionName]
	}

	public getValue<V extends Environment.Value = Environment.Value>(name: keyof Environment.NameStore): V {
		return this.names[name] as V
	}

	public getDimension(dimensionName: keyof Environment.SelectedDimensions): string[] {
		return this.names.dimensions[dimensionName]
	}

	public getAllNames(): Environment.NameStore {
		return { ...this.names }
	}

	public getAllDimensions(): Environment.SelectedDimensions {
		return { ...this.names.dimensions }
	}

	public getSystemVariable<N extends Environment.SystemVariableName>(name: N): Environment.SystemVariables[N] {
		return this.names[name]
	}

	public putName(name: Environment.Name, value: Environment.Value): Environment {
		return new Environment({
			...this.names,
			dimensions: { ...this.names.dimensions },
			[name]: value,
		})
	}

	public putSystemVariable<N extends Environment.SystemVariableName>(
		name: N,
		value: Environment.SystemVariables[N],
	): Environment {
		return this.putName(name, value)
	}

	public putDelta(delta: Partial<Environment.NameStore>): Environment {
		const currentNames = this.getAllNames()

		for (const newName in delta) {
			const deltaValue = delta[newName]
			if (deltaValue === undefined) {
				delete currentNames[newName]
			} else {
				currentNames[newName] = deltaValue
			}
		}

		return new Environment(currentNames)
	}

	public updateDimensionsIfNecessary(
		dimensions: Environment.NameStore['dimensions'],
		defaultDimensions: Environment.NameStore['dimensions'],
	): Environment {
		const normalizedDimensions: Environment.NameStore['dimensions'] = {
			...defaultDimensions,
			...dimensions,
		}

		const dimensionsEqual = JSON.stringify(this.names.dimensions) === JSON.stringify(normalizedDimensions)
		return dimensionsEqual
			? this
			: new Environment({
					...this.names,
					dimensions: { ...normalizedDimensions },
			  })
	}

	public static generateDelta(
		currentEnvironment: Environment,
		delta: Environment.DeltaFactory,
	): Partial<Environment.NameStore> {
		const newDelta: Partial<Environment.NameStore> = {}

		for (const name in delta) {
			const value = delta[name]

			newDelta[name] =
				value &&
				value instanceof Function &&
				!Environment.systemVariableNames.has(name as Environment.SystemVariableName)
					? value(currentEnvironment)
					: delta[name]
		}

		return newDelta
	}

	public applySystemMiddleware<
		N extends Environment.SystemMiddlewareName,
		A extends Parameters<Exclude<Environment.SystemMiddleware[N], undefined>>
	>(name: N, ...args: A): ReturnType<Exclude<Environment.SystemMiddleware[N], undefined>> | A {
		const middleware: Environment.SystemMiddleware[N] = this.names[name]
		if (typeof middleware === 'function') {
			return (middleware as (...args: A) => any)(...args)
		}
		return args
	}
}

namespace Environment {
	export type Name = string | number

	export type Value = React.ReactNode

	export interface SystemVariables {
		labelMiddleware?: (label: React.ReactNode) => React.ReactNode
	}

	export const systemVariableNames: Set<SystemVariableName> = new Set(['labelMiddleware'])

	export type SystemVariableName = keyof SystemVariables

	export interface SelectedDimensions {
		[key: string]: string[]
	}

	export interface NameStore extends SystemVariables {
		dimensions: SelectedDimensions

		[name: string]: Value
	}

	export type DeltaFactory = { [N in string]: ((environment: Environment) => Environment.Value) | Environment.Value } &
		{ [N in keyof SystemVariables]?: SystemVariables[N] }

	export type SystemMiddleware = {
		[N in SystemMiddlewareName]: SystemVariables[N]
	}

	export type SystemMiddlewareName = 'labelMiddleware'

	export const defaultSystemVariables: SystemVariables = {
		labelMiddleware: label => label,
	}

	export const defaultNameStore: NameStore = {
		...defaultSystemVariables,
		dimensions: {},
	}
}

export { Environment }
