import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";

/**
 * Página Inicial (Home)
 * Ponto de entrada do projeto web. Agrupa os componentes base da Landing Page.
 */
export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Componente de navegação principal superior */}
      <Header />
      
      {/* Seção principal de chamada inicial com a marca */}
      <Hero />
      
      {/* Seção de funcionalidades detalhadas da plataforma */}
      <Features />
    </main>
  );
}
