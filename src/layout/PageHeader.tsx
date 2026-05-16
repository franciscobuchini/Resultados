import { useThemeClasses } from '../functions/themeStore'
import { Button } from '../components/ui/Button'
import { Dropdown, DropdownItem } from '../components/ui/Dropdown'

interface Tab {
  id: string
  label: string
  disabled?: boolean
  dropdownItems?: { label: string; onClick?: () => void }[]
}

interface PageHeaderProps {
  tabs: Tab[]
  activeTabId: string
  onChange?: (id: string) => void
  isHeaderVariant?: boolean
}

export default function PageHeader({ tabs, activeTabId, onChange, isHeaderVariant = false }: PageHeaderProps) {
  const { bgProminent, textMain, textMuted } = useThemeClasses()

  return (
    <div className={`flex items-center gap-1  no-scrollbar pb-1 ${isHeaderVariant ? 'mb-0' : 'mb-8'}`}>
      <div className="flex items-center gap-1 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id

          if (tab.dropdownItems && tab.dropdownItems.length > 0) {
            return (
              <Dropdown
                key={tab.id}
                value={tab.label}
                triggerOnHover={true}
                align="left"
                widthClass="min-w-max"
              >
                {tab.dropdownItems.map((item, idx) => (
                  <DropdownItem
                    key={idx}
                    label={item.label}
                    onClick={item.onClick || (() => { })}
                  />
                ))}
              </Dropdown>
            )
          }

          return (
            <Button
              key={tab.id}
              value={tab.label} // Usamos value para que el texto NO se oculte en mobile
              onClick={() => !tab.disabled && onChange?.(tab.id)}
              disabled={tab.disabled}
              className={`
                h-9 px-4 rounded-xl transition-all duration-200 whitespace-nowrap border-none
                ${isActive
                  ? `${bgProminent} ${textMain}`
                  : `bg-transparent ${textMuted}`
                }
              `}
            />
          )
        })}
      </div>
    </div>
  )
}

