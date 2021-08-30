import { Aether } from '../src'
import '../src/index.sass'
import './global.sass'

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: {
    source: {
      type: 'dynamic',
      excludeDecorators: true,
    },
  },
}

export const decorators = [
  (Story) => <Aether style={{
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '1em',
    padding: '2em',
  }}>
    <Story />
  </Aether>,
]
