import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';

/** Mensagem legível a partir de um erro HTTP no formato Problem Details da API. */
export function mensagemDeErro(erro: unknown, padrao = 'Não foi possível concluir a operação.'): string {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0) {
      return 'Sem conexão com a API. Verifique se o back-end está rodando.';
    }
    const detalhe = erro.error?.detail;
    if (typeof detalhe === 'string' && detalhe) {
      return detalhe;
    }
  }
  return padrao;
}

/**
 * Copia os erros por campo devolvidos pela API (propriedade "erros") para os controles do formulário,
 * para que apareçam embaixo de cada campo como os erros de validação locais.
 */
export function aplicarErrosDoServidor(form: FormGroup, erro: unknown): boolean {
  const erros = erro instanceof HttpErrorResponse ? erro.error?.erros : null;
  if (!erros || typeof erros !== 'object') {
    return false;
  }
  let aplicou = false;
  for (const [campo, mensagem] of Object.entries(erros as Record<string, string>)) {
    const controle = form.get(campo);
    if (controle) {
      controle.setErrors({ servidor: mensagem });
      controle.markAsTouched();
      aplicou = true;
    }
  }
  return aplicou;
}
