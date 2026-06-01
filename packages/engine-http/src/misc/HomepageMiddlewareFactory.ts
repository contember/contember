import { HttpController } from '../application/index.js'
import { HttpResponse } from '../common/index.js'

export const homepageController: HttpController = () => Promise.resolve(new HttpResponse(200, 'App is running'))
