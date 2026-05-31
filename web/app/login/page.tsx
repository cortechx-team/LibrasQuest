'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useState } from 'react';
import Header from '../components/Header';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <Header />

      <section className="flex min-h-screen items-center justify-center px-5 py-28">
        <div className="w-full max-w-md rounded-2xl border border-primary-cyan/35 bg-bg-dark/75 p-6 shadow-[0_0_40px_rgba(66,245,227,0.16)] backdrop-blur-md sm:p-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:border-primary-cyan hover:text-primary-cyan"
          >
            Voltar
          </Link>

          <div className="mb-7 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-primary-cyan">
              Progresso salvo
            </p>
            <h1 className="text-3xl font-bold">
              {isRegistering ? 'Criar conta' : 'Entrar no LibrasQuest'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Jogar continua livre. Com uma conta, suas missões, XP e conquistas ficam guardados para a próxima jornada.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegistering && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/85">Nome</span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-primary-cyan"
                  placeholder="Seu nome"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/85">E-mail</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-primary-cyan"
                placeholder="voce@email.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/85">Senha</span>
              <input
                type="password"
                name="password"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-primary-cyan"
                placeholder="Sua senha"
              />
            </label>

            {isRegistering && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/85">Confirmar senha</span>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/35 focus:border-primary-cyan"
                  placeholder="Repita sua senha"
                />
              </label>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-primary-cyan px-6 py-3 font-bold text-black shadow-lg transition-all hover:-translate-y-1 hover:shadow-primary-cyan/50"
            >
              {isRegistering ? 'Registrar-se' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm text-white/75">
            <button
              type="button"
              onClick={() => setIsRegistering((current) => !current)}
              className="font-bold text-primary-cyan transition-colors hover:text-white"
            >
              {isRegistering
                ? 'Já tenho uma conta'
                : 'Ainda não tenho login, quero registrar-me'}
            </button>

            <Link href="/" className="text-white/65 transition-colors hover:text-primary-cyan">
              Continuar jogando sem login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
