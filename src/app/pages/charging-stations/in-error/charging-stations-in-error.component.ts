import { Component } from '@angular/core';

import { ChargingStationsInErrorTableDataSource } from './charging-stations-in-error-table-data-source';

@Component({
  selector: 'app-charging-stations-in-error',
  template: '<app-table [dataSource]="chargingStationsInErrorTableDataSource"></app-table>',
  providers: [ChargingStationsInErrorTableDataSource],
})
export class ChargingStationsInErrorComponent {

  constructor(
    public chargingStationsInErrorTableDataSource: ChargingStationsInErrorTableDataSource,
  ) {
  }
}
