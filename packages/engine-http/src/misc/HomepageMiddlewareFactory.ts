import { HttpController } from '../application'
import { HttpResponse } from '../common'

export const homepageController: HttpController = () =>
	Promise.resolve(new HttpResponse(200, 'App is running'))
