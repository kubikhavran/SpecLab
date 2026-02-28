import { useRef } from 'react'
import type { PlotlyHTMLElement } from 'plotly.js'
import { PlotArea } from '../features/plot/PlotArea'
import { Sidebar } from '../ui/Sidebar'
import { AppStoreProvider } from './state/AppStore'

export function AppLayout() {
  const plotDivRef = useRef<PlotlyHTMLElement | null>(null)

  return (
    <AppStoreProvider>
      <div className="h-screen bg-slate-100 text-slate-900">
        <div className="flex h-full">
          <aside className="w-72 shrink-0 border-r border-slate-200 bg-white">
            <Sidebar plotDivRef={plotDivRef} />
          </aside>

          <main className="flex-1 overflow-auto p-6 lg:p-8">
            <PlotArea plotDivRef={plotDivRef} />
          </main>
        </div>
      </div>
    </AppStoreProvider>
  )
}
