import Link from 'next/link';

/**
 * Componente de Cabeçalho (Header)
 * Responsável pela navegação principal da página de entrada.
 */
export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex w-full items-center justify-between bg-bg-dark/90 px-[10%] py-5 backdrop-blur-sm">
      {/* Logotipo */}
      <div className="text-2xl font-bold text-primary-cyan">
        LibrasQuest
      </div>
      
      {/* Menu de Navegação // por enquanto só visual */}
      <nav className="flex items-center gap-6">
        <Link href="#" className="text-white text-sm hover:text-primary-cyan transition-colors">
          Sobre 
        </Link>
      </nav>
    </header>
  );
}
