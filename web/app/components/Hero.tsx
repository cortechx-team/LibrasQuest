'use client';

import { useCameraPermission } from '../hooks/useCameraPermission';

/**
 * Componente Hero
 * Seção de destaque inicial da página de aterrissagem (Hero Section).
 * Apresenta o título em pixel art e um "Call to Action" (Chamada para Ação).
 */
export default function Hero() {
  const { status, isLoading, error, requestPermission } = useCameraPermission();

  const handleCameraTest = async () => {
    await requestPermission();

    // Tratar o resultado após a requisição
    if (status === 'granted') {
      alert('Permissão concedida! Você pode começar a usar a câmera');
      // TODO: Navegar para a página de teste da câmera
    } else if (status === 'denied') {
      alert('Permissão negada. Para usar o LibrasQuest, você precisa permitir o acesso à câmera');
    } else if (status === 'unsupported') {
      alert('Seu navegador não suporta acesso à câmera ou nenhuma câmera foi encontrada');
    } else if (status === 'error') {
      alert(`Ocorreu um erro ao acessar a câmera: ${error || 'Tente novamente'}`);
    }
  };

  return (
    <section className="relative h-screen flex flex-col items-center justify-center text-center px-5 bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e]">
      
      {/* Título Principal Estilo Pixel Art e Efeitos */}
      <div className="pixel-title text-primary-cyan text-4xl sm:text-5xl md:text-6xl mb-25 z-10">
        LibrasQuest
      </div>

      {/* Subtítulo Destacando o Propósito */}
      <h1 className="text-3xl md:text-4xl font-semibold mb-5 z-10 text-text-white mt-0">
        O aprendizado de Libras <br className="hidden sm:block" /> ficou fácil
      </h1>

      {/* Descrição do Produto/Projeto */}
      <p className="text-lg md:text-xl max-w-150 mb-8 opacity-80 z-10 text-white leading-relaxed">
        Domine a Língua Brasileira de Sinais através de desafios, missões e uma jornada gamificada épica.
      </p>

      {/* Botões de Ação */}
      <div className="flex z-10">
        <button 
          onClick={handleCameraTest}
          disabled={isLoading}
          className="bg-primary-cyan text-black px-8 py-3 rounded-full font-bold hover:bg-opacity-80 transition-all shadow-lg hover:shadow-primary-cyan/50 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Aguardando câmera...' : 'Teste sua câmera para começar'}
        </button>
      </div>

    </section>
  );
}
