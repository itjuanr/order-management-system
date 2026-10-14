import { Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

/** Versão atrasada de um signal; útil para buscas digitadas não dispararem uma requisição por tecla. */
export function debounced<T>(fonte: Signal<T>, ms = 300): Signal<T> {
  return toSignal(toObservable(fonte).pipe(debounceTime(ms), distinctUntilChanged()), {
    initialValue: fonte(),
  });
}
