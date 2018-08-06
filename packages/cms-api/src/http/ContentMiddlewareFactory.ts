import {RequestHandler} from 'express'
import ContentMiddlewareFactoryMiddlewareFactory from './ContentMiddlewareFactoryMiddlewareFactory'

export default class ContentMiddlewareFactory {
  create(): RequestHandler {
    return (req, res: ContentMiddlewareFactoryMiddlewareFactory.ResponseWithContentMiddleware, next) => {
      if (typeof res.locals.contentMiddleware !== 'undefined') {
        res.locals.contentMiddleware(req, res, next)
      } else {
        next()
      }
    }
  }
}
