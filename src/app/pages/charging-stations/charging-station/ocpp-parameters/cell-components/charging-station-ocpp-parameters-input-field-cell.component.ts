import { AfterViewInit, Component, ElementRef, Injectable, Input, ViewChild } from '@angular/core';
import { CellContentTemplateDirective } from 'app/shared/table/cell-content-template/cell-content-template.directive';
import { OcppParameter } from 'app/types/ChargingStation';
import { TableColumnDef } from 'app/types/Table';

@Component({
  selector: 'app-charging-station-ocpp-parameters-input-field-cell',
  template: `
    <ng-container *ngIf="row.id !== customOcppParameterRowID">
      <span class="text-right" >{{row.key}}</span>
    </ng-container>
    <ng-container *ngIf="row.id === customOcppParameterRowID">
      <input id="key" name="key" class="form-control text-line"
        [class.table-warning]="row['keyFormControl']?.errors"
        required maxlength="50" [placeholder]="'chargers.charger_param_key' | translate"
        [ngModel]="row['key']" (ngModelChange)="valueChanged($event)"
        type="text">
      <mat-error *ngIf="row['keyFormControl']?.errors as errors">
        <ng-template ngFor let-error [ngForOf]="tableColumnDef?.errors">
          <div class="table-mat-error text-left" *ngIf="errors ? errors[error.id] : false"
            [translate]="error.message" [translateParams]="error.messageParams">
          </div>
        </ng-template>
      </mat-error>
    </ng-container>
  `,
})
@Injectable()
export class ChargingStationOcppParametersInputFieldCellComponent extends CellContentTemplateDirective implements AfterViewInit {
  public static CUSTOM_OCPP_PARAMETER_ID = 'CustomOcppParameter';
  public customOcppParameterRowID = ChargingStationOcppParametersInputFieldCellComponent.CUSTOM_OCPP_PARAMETER_ID;
  public tableColumnDef: TableColumnDef;
  @Input() public row!: OcppParameter;

  public ngAfterViewInit() {
    // Get the key column def
    if (this.row) {
      this.tableColumnDef = this.row['keyTableColumnsDef'] as TableColumnDef;
    }
  }

  public valueChanged(value: string) {
    this.row.key = value;
    this.componentChanged.emit(value);
  }
}
