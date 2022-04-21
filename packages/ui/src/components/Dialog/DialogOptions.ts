import type { DialogSettings } from './DialogSettings'

export type OpenDialog<Result> = (options: DialogSettings<Result>) => Promise<Result | undefined>

export interface DialogOptions<Result> {
	openDialog: OpenDialog<Result>
}
