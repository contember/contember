import { IFormGroupProps } from '@blueprintjs/core'
import * as React from 'react'
import { SelectedDimension } from '../../state/request'
import SystemMiddleware = Environment.SystemMiddleware

class Environment {
	public constructor(
		private readonly names: Environment.NameStore = {
			dimensions: {}
		}
	) {}

	public getValue(name: keyof Environment.NameStore): Environment.Value | undefined {
		if (!(name in this.names)) {
			return undefined
		}
		return this.names[name]
	}

	public getAllNames(): Environment.NameStore {
		return { ...this.names }
	}

	public getDimensions(): SelectedDimension {
		return { ...this.names.dimensions }
	}

	public getSystemVariable<N extends Environment.SystemVariableName>(name: N): Environment.SystemVariables[N] {
		return this.names[name]
	}

	public putName(name: Environment.Name, value: Environment.Value): Environment {
		return new Environment({
			...this.names,
			dimensions: { ...this.names.dimensions },
			[name]: value
		})
	}

	public putSystemVariable<N extends Environment.SystemVariableName>(
		name: N,
		value: Environment.SystemVariables[N]
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

	public static generateDelta(
		currentEnvironment: Environment,
		delta: Environment.DeltaFactory
	): Partial<Environment.NameStore> {
		const newDelta: Partial<Environment.NameStore> = {}

		for (const name in delta) {
			const value = delta[name]

			newDelta[name] =
				value && value instanceof Function && !Environment.systemVariableNames.includes(name as any)
					? value(currentEnvironment)
					: delta[name]
		}

		return newDelta
	}

	public applySystemMiddleware<
		N extends Environment.SystemMiddlewareName,
		A extends Parameters<Exclude<Environment.SystemMiddleware[N], undefined>>
	>(name: N, ...args: A): ReturnType<Exclude<Environment.SystemMiddleware[N], undefined>> | A {
		const middleware: SystemMiddleware[N] = this.names[name]
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
		labelMiddleware?: (label: IFormGroupProps['label']) => React.ReactNode
	}

	export const systemVariableNames: SystemVariableName[] = ['labelMiddleware']

	export type SystemVariableName = keyof SystemVariables

	export interface NameStore extends SystemVariables {
		dimensions: SelectedDimension

		[name: string]: Value
	}

	export type DeltaFactory = { [N in string]: ((environment: Environment) => Environment.Value) | Environment.Value } &
		{ [N in keyof SystemVariables]: SystemVariables[N] }

	export type SystemMiddleware = {
		[N1 in {
			[N2 in SystemVariableName]: SystemVariables[N2] extends (undefined | ((...args: any[]) => any)) ? N2 : never
		}[SystemVariableName]]: SystemVariables[N1]
	}

	export type SystemMiddlewareName = keyof SystemMiddleware
}

export { Environment }
