import { useEffect, useRef, type MutableRefObject } from 'react'
import type { PlotlyHTMLElement } from 'plotly.js'
import { PlotArea } from '../features/plot/PlotArea'
import { Sidebar } from '../ui/Sidebar'
import { AppStoreProvider, useAppState } from './state/AppStore'

const THEME_STORAGE_KEY = 'speclab.theme'
const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

type AppLayoutContentProps = {
  plotDivRef: MutableRefObject<PlotlyHTMLElement | null>
}

function AppLayoutContent({ plotDivRef }: AppLayoutContentProps) {
  const { themeMode } = useAppState()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
    } catch {
      // Ignore persistence failures in restricted browser modes.
    }
  }, [themeMode])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const root = document.documentElement
    const mediaQuery = window.matchMedia(SYSTEM_DARK_QUERY)
    const applyTheme = (prefersDark: boolean) => {
      const isDark = themeMode === 'dark' || (themeMode === 'system' && prefersDark)
      root.classList.toggle('dark', isDark)
    }

    applyTheme(mediaQuery.matches)

    if (themeMode !== 'system') {
      return
    }

    const handleThemeChange = (event: MediaQueryListEvent) => {
      applyTheme(event.matches)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleThemeChange)
      return () => {
        mediaQuery.removeEventListener('change', handleThemeChange)
      }
    }

    mediaQuery.addListener(handleThemeChange)
    return () => {
      mediaQuery.removeListener(handleThemeChange)
    }
  }, [themeMode])

  return (
    <div className="h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-full">
        <aside className="w-72 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Sidebar plotDivRef={plotDivRef} />
        </aside>

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <PlotArea plotDivRef={plotDivRef} />
        </main>
      </div>
    </div>
  )
}

export function AppLayout() {
  const plotDivRef = useRef<PlotlyHTMLElement | null>(null)

  return (
    <AppStoreProvider>
      <AppLayoutContent plotDivRef={plotDivRef} />
    </AppStoreProvider>
  )
}
