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
}

export default function PageHeader({ tabs, activeTabId, onChange }: PageHeaderProps) {
  const { bgProminent, textMain, textMuted, border } = useThemeClasses()

  return (
    <div className="flex items-center gap-3 mb-8 px-2 flex-wrap">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id
        
        if (tab.dropdownItems && tab.dropdownItems.length > 0) {
          return (
            <Dropdown
              key={tab.id}
              value={tab.label}
              triggerOnHover={true}
              align="left"
              widthClass="w-56"
            >
              {tab.dropdownItems.map((item, idx) => (
                <DropdownItem 
                  key={idx} 
                  label={item.label} 
                  onClick={item.onClick || (() => {})} 
                />
              ))}
            </Dropdown>
          )
        }

        return (
          <Button
            key={tab.id}
            label={tab.label}
            onClick={() => !tab.disabled && onChange?.(tab.id)}
            disabled={tab.disabled}
            className={`
              h-10 px-5 rounded-2xl transition-all duration-300
              ${isActive 
                ? `${bgProminent} ${textMain} ${border}` 
                : `bg-transparent border-transparent ${textMuted} hover:bg-white/5`
              }
            `}
          />
        )
      })}
    </div>
  )
}

