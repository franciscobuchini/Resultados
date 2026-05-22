import { useTheme, useThemeClasses } from '../functions/themeStore';

export default function Footer() {
  const { bgApp, border } = useThemeClasses();
  const { showApiIds, setShowApiIds } = useTheme();

  return (
    <footer className={`${bgApp} border-t ${border} py-4 px-6 mt-auto flex items-center justify-center group`}>
      <button
        onClick={() => setShowApiIds(!showApiIds)}
        className="group-hover:opacity-40 opacity-0 text-[9px] transition-opacity cursor-pointer"
        title="Toggle API IDs"
      >
        {showApiIds ? 'IDs: ON' : '⚙'}
      </button>
    </footer>
  );
}