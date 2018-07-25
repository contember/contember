import CompositionRoot from './CompositionRoot'
import Env from './Env'

(async () => {
  const env = Env.fromUnsafe(process.env)
  const compositionRoot = new CompositionRoot()
  const server = compositionRoot.composeServer(env)
  const serverInfo = await server.listen()
  console.log(`Server ready at ${serverInfo.url}`)
})()
