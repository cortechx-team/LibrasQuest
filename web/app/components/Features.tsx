/**
 * Componente Features
 * Responsável por exibir as principais funcionalidades do projeto.
 * Contém um layout responsivo de grade para os itens chave.
 */
export default function Features() {
  return (
    <section className="bg-white text-[#333] px-[10%] py-[100px] text-center">
      {/* Título da Seção */}
      <h2 className="text-3xl md:text-5xl text-[#1a1a1a] font-bold mb-6">
        Aprendizado <span className="text-accent-purple">intuitivo</span> para todos
      </h2>
      
      {/* Breve Descrição */}
      <p className="text-lg max-w-[800px] mx-auto text-gray-600 mb-[50px]">
        O LibrasQuest transforma sinais complexos em mecânicas de jogo divertidas. Aprenda a lógica da Libras sem a pressão de métodos tradicionais.
      </p>
      
      {/* Grades de Funcionalidades */}
      <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-12 md:gap-24 mt-12">
        
        {/* Funcionalidade 1: Reconhecimento */}
        <div className="max-w-[300px] flex flex-col items-center">
          <div className="text-[50px] mb-4">🖐️</div>
          <h3 className="text-2xl font-bold mb-3 text-[#1a1a1a]">Reconhecimento</h3>
          <p className="text-gray-600">
            Pratique sinais em tempo real com auxílio de IA.
          </p>
        </div>

        {/* Funcionalidade 2: Gamificação */}
        <div className="max-w-[300px] flex flex-col items-center">
          <div className="text-[50px] mb-4">🎮</div>
          <h3 className="text-2xl font-bold mb-3 text-[#1a1a1a]">Gamificação</h3>
          <p className="text-gray-600">
            Ganhe XP, desbloqueie conquistas e suba de nível.
          </p>
        </div>

      </div>
    </section>
  );
}
