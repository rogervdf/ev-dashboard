import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { CellContentTemplateDirective } from 'app/shared/table/cell-content-template/cell-content-template.directive';
import { ChipType } from 'app/types/GlobalType';
import { OcpiEndpointDetail } from 'app/types/ocpi/OCPIEndpoint';
import { Constants } from 'app/utils/Constants';

@Component({
  template: `
    <mat-chip-list [selectable]="false">
      <mat-chip [ngClass]="row.failureNbr | appFormatOcpiEvsesFailure:'class'" [disabled]="true">
        {{row.failureNbr}}
      </mat-chip>
    </mat-chip-list>
  `,
})
export class OcpiDetailFailureEvsesStatusFormatterComponent extends CellContentTemplateDirective {
  @Input() public row!: OcpiEndpointDetail;
}

@Pipe({name: 'appFormatOcpiEvsesFailure'})
export class AppFormatOcpiEvsesFailurePipe implements PipeTransform {
  public transform(failureNbr: number, type: string): string {
    if (type === 'class') {
      let classNames = 'chip-width-4em ';
      if (failureNbr > 0) {
        classNames += ChipType.DANGER;
      } else {
        classNames += ChipType.GREY;
      }
      return classNames;
    }
    return '';
  }
}
