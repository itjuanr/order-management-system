import { Pipe, PipeTransform } from '@angular/core';

export type TipoDocumento = 'cpf' | 'cnpj' | 'telefone' | 'cep';

const MASCARAS: Record<TipoDocumento, string> = {
  cpf: '000.000.000-00',
  cnpj: '00.000.000/0000-00',
  telefone: '(00) 00000-0000',
  cep: '00000-000',
};

/** Aplica a máscara sobre os dígitos já digitados (formatação progressiva). */
export function formatar(valor: string | null | undefined, tipo: TipoDocumento): string {
  const digitos = (valor ?? '').replace(/\D/g, '');
  let mascara = MASCARAS[tipo];
  if (tipo === 'telefone' && digitos.length <= 10) {
    mascara = '(00) 0000-0000';
  }
  let resultado = '';
  let i = 0;
  for (const simbolo of mascara) {
    if (i >= digitos.length) {
      break;
    }
    resultado += simbolo === '0' ? digitos[i++] : simbolo;
  }
  return resultado;
}

/** "Marina Duarte" → "MD" */
export function iniciais(nome: string | null | undefined): string {
  return (nome ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

@Pipe({ name: 'iniciais' })
export class IniciaisPipe implements PipeTransform {
  transform(nome: string | null | undefined): string {
    return iniciais(nome);
  }
}

const relativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

/** "há 3 minutos", "agora" */
export function tempoRelativo(data: string | Date): string {
  const segundos = Math.round((new Date(data).getTime() - Date.now()) / 1000);
  const abs = Math.abs(segundos);
  if (abs < 10) return 'agora';
  if (abs < 60) return relativo.format(segundos, 'second');
  if (abs < 3600) return relativo.format(Math.round(segundos / 60), 'minute');
  if (abs < 86400) return relativo.format(Math.round(segundos / 3600), 'hour');
  return relativo.format(Math.round(segundos / 86400), 'day');
}

@Pipe({ name: 'tempoRelativo', pure: false })
export class TempoRelativoPipe implements PipeTransform {
  transform(data: string | Date): string {
    return tempoRelativo(data);
  }
}

@Pipe({ name: 'documento' })
export class DocumentoPipe implements PipeTransform {
  transform(valor: string | null | undefined, tipo: TipoDocumento): string {
    return valor ? formatar(valor, tipo) : '—';
  }
}
