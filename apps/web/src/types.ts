import type { prepareSession } from '@estuda/core';

/** Alvo de uma sessão: bloco do plano ou sessão livre. */
export type Target = Parameters<typeof prepareSession>[1];

export type Tab = 'inicio' | 'plano' | 'conteudos' | 'tecnicas' | 'progresso' | 'perfil';
