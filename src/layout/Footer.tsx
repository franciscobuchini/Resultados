import { useThemeClasses } from '../functions/themeStore';

export default function Footer() {
  const { bgApp, border } = useThemeClasses();
  return (
    <footer className={`${bgApp} border-t ${border} py-12 px-6 mt-auto`}>
    </footer>
  );
}
