import type { ComponentType } from 'react'

/**
 * Configuración que debe exportar cada archivo .tab.tsx
 */
export interface TabConfig {
  id: string
  label: string
  order: number
  disabled?: boolean
}

/**
 * Módulo resuelto por import.meta.glob para archivos .tab.tsx
 */
export interface TabModule {
  tabConfig: TabConfig
  default: ComponentType<any>
}

/**
 * Utilidad: dado el resultado de import.meta.glob, devuelve
 * las tabs ordenadas y listas para PageHeader + renderizado.
 */
export function resolveTabModules(modules: Record<string, unknown>): TabModule[] {
  return Object.values(modules)
    .filter((mod): mod is TabModule => {
      const m = mod as any
      return m?.tabConfig?.id && m?.default
    })
    .sort((a, b) => a.tabConfig.order - b.tabConfig.order)
}
