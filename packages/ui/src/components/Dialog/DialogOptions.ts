import type { DialogSettings } from './DialogSettings'

export type OpenDialog = <Success>(options: DialogSettings<Success>) => Promise<Success>

export interface DialogOptions {
	openDialog: OpenDialog
}
