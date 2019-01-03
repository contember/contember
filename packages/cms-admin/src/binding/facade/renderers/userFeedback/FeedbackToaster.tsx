import { IToaster, Toaster } from '@blueprintjs/core'

export class FeedbackToaster {
	private static _toaster?: IToaster

	public static get toaster(): IToaster {
		if (FeedbackToaster._toaster === undefined) {
			FeedbackToaster._toaster = Toaster.create()
		}
		return FeedbackToaster._toaster
	}
}
