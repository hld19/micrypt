import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const globalAny = window as unknown as Record<string, unknown>
if (!globalAny.go) {
  const rejector = (..._args: unknown[]) => Promise.reject(new Error('Backend unavailable in browser mode'))
  let leaf: any
  leaf = new Proxy(rejector, {
    apply: (_target, _thisArg, callArgs) => rejector(...callArgs),
    get: () => leaf,
  })
  globalAny.go = new Proxy(
    {},
    {
      get: () => leaf,
    },
  )
  if (!globalAny.runtime) {
    globalAny.runtime = new Proxy(
      {},
      {
        get: () => leaf,
      },
    )
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
