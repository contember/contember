import { PropsWithChildren } from 'react'

export type NestedClassName = string | false | null | undefined | (string | false | null | undefined)[] | NestedClassName[]
export type ClassNameStateMap = { [key: string]: string | number | boolean | null | undefined }

export type ComponentClassNameProps = PropsWithChildren<{
	className?: NestedClassName;
	componentClassName?: string | string[];
}>
