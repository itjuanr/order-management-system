import { Component, computed, input } from '@angular/core';
import { STATUS_PEDIDO } from '../core/labels';
import { StatusPedido } from '../core/models';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [attr.data-tom]="info().tom">{{ info().label }}</span>`,
})
export class StatusBadgeComponent {
  readonly status = input.required<StatusPedido>();
  readonly info = computed(() => STATUS_PEDIDO[this.status()]);
}
