/**
 * Componente de rodapé (Footer)
 * Responsável pela exibição do rodapé do site, contendo informações de contato, links para redes sociais e direitos autorais.
 */
export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4">
      <div className="container mx-auto text-center">
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} LibrasQuest. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}