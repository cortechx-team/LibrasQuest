import { getApiUrl } from './api';

type DictionaryWordResponse = {
  id: number;
  word: string;
};

export async function fetchDictionaryWords(): Promise<string[]> {
  let response: Response;

  try {
    response = await fetch(`${getApiUrl()}/dictionary/words`);
  } catch {
    throw new Error('Backend indisponível. Verifique se a API está rodando em http://localhost:8000.');
  }

  if (!response.ok) {
    throw new Error(`Não foi possível carregar as palavras do aprendizado. Status: ${response.status}.`);
  }

  const words = await response.json() as DictionaryWordResponse[];
  return words.map(({ word }) => word);
}
