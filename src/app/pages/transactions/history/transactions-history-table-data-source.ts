import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TableCheckLogsAction } from 'app/pages/logs/table-actions/table-check-logs-action';
import { SpinnerService } from 'app/services/spinner.service';
import { AppCurrencyPipe } from 'app/shared/formatters/app-currency.pipe';
import { TableMoreAction } from 'app/shared/table/actions/table-more-action';
import { EndDateFilter } from 'app/shared/table/filters/end-date-filter';
import { SiteTableFilter } from 'app/shared/table/filters/site-table-filter';
import { StartDateFilter } from 'app/shared/table/filters/start-date-filter';
import { Connector } from 'app/types/ChargingStation';
import { DataResult, TransactionDataResult } from 'app/types/DataResult';
import { LogButtonAction } from 'app/types/Log';
import { TableActionDef, TableColumnDef, TableDef, TableFilterDef } from 'app/types/Table';
import TenantComponents from 'app/types/TenantComponents';
import { Transaction, TransactionButtonAction } from 'app/types/Transaction';
import { User } from 'app/types/User';
import * as moment from 'moment';
import { Observable } from 'rxjs';

import { AuthorizationService } from '../../../services/authorization.service';
import { CentralServerNotificationService } from '../../../services/central-server-notification.service';
import { CentralServerService } from '../../../services/central-server.service';
import { ComponentService } from '../../../services/component.service';
import { DialogService } from '../../../services/dialog.service';
import { MessageService } from '../../../services/message.service';
import { ConsumptionChartDetailComponent } from '../../../shared/component/consumption-chart/consumption-chart-detail.component';
import { AppConnectorIdPipe } from '../../../shared/formatters/app-connector-id.pipe';
import { AppDatePipe } from '../../../shared/formatters/app-date.pipe';
import { AppDurationPipe } from '../../../shared/formatters/app-duration.pipe';
import { AppPercentPipe } from '../../../shared/formatters/app-percent-pipe';
import { AppUnitPipe } from '../../../shared/formatters/app-unit.pipe';
import { AppUserNamePipe } from '../../../shared/formatters/app-user-name.pipe';
import { TableAutoRefreshAction } from '../../../shared/table/actions/table-auto-refresh-action';
import { TableRefreshAction } from '../../../shared/table/actions/table-refresh-action';
import { ChargingStationTableFilter } from '../../../shared/table/filters/charging-station-table-filter';
import { IssuerFilter } from '../../../shared/table/filters/issuer-filter';
import { SiteAreaTableFilter } from '../../../shared/table/filters/site-area-table-filter';
import { UserTableFilter } from '../../../shared/table/filters/user-table-filter';
import { TableDataSource } from '../../../shared/table/table-data-source';
import ChangeNotification from '../../../types/ChangeNotification';
import { Constants } from '../../../utils/Constants';
import { Utils } from '../../../utils/Utils';
import { TransactionsInactivityCellComponent } from '../cell-components/transactions-inactivity-cell.component';
import { TransactionsInactivityStatusFilter } from '../filters/transactions-inactivity-status-filter';
import { TableCreateTransactionInvoiceAction, TableCreateTransactionInvoiceActionDef } from '../table-actions/table-create-transaction-invoice-action';
import { TableDeleteTransactionAction, TableDeleteTransactionActionDef } from '../table-actions/table-delete-transaction-action';
import { TableExportTransactionsAction, TableExportTransactionsActionDef } from '../table-actions/table-export-transactions-action';
import { TableRebuildTransactionConsumptionsAction, TableRebuildTransactionConsumptionsActionDef } from '../table-actions/table-rebuild-transaction-consumptions-action';
import { TableRoamingPushCdrAction, TableRoamingPushCdrActionDef } from '../table-actions/table-roaming-push-cdr-action';
import { TableViewTransactionAction, TableViewTransactionActionDef } from '../table-actions/table-view-transaction-action';

@Injectable()
export class TransactionsHistoryTableDataSource extends TableDataSource<Transaction> {
  private isAdmin = false;
  private isSiteAdmin = false;
  private viewAction = new TableViewTransactionAction().getActionDef();
  private deleteAction = new TableDeleteTransactionAction().getActionDef();
  private checkLogsAction = new TableCheckLogsAction().getActionDef();
  private rebuildTransactionConsumptionsAction = new TableRebuildTransactionConsumptionsAction().getActionDef();
  private createInvoice = new TableCreateTransactionInvoiceAction().getActionDef();
  private pushCdr = new TableRoamingPushCdrAction().getActionDef();

  constructor(
    public spinnerService: SpinnerService,
    public translateService: TranslateService,
    private messageService: MessageService,
    private dialogService: DialogService,
    private router: Router,
    private dialog: MatDialog,
    private centralServerNotificationService: CentralServerNotificationService,
    private centralServerService: CentralServerService,
    private authorizationService: AuthorizationService,
    private componentService: ComponentService,
    private datePipe: AppDatePipe,
    private appUnitPipe: AppUnitPipe,
    private appPercentPipe: AppPercentPipe,
    private appConnectorIdPipe: AppConnectorIdPipe,
    private appUserNamePipe: AppUserNamePipe,
    private appDurationPipe: AppDurationPipe,
    private appCurrencyPipe: AppCurrencyPipe) {
    super(spinnerService, translateService);
    // Admin
    this.isAdmin = this.authorizationService.isAdmin();
    this.isSiteAdmin = this.authorizationService.hasSitesAdminRights();
    // Init
    this.initDataSource();
    // Add statistics to query
    this.setStaticFilters([{ Statistics: 'history' }]);
  }

  public getDataChangeSubject(): Observable<ChangeNotification> {
    return this.centralServerNotificationService.getSubjectTransactions();
  }

  public loadDataImpl(): Observable<DataResult<Transaction>> {
    return new Observable((observer) => {
      this.centralServerService.getTransactions(this.buildFilterValues(), this.getPaging(), this.getSorting())
        .subscribe((transactions) => {
          // Ok
          observer.next(transactions);
          observer.complete();
        }, (error) => {
          Utils.handleHttpError(error, this.router, this.messageService, this.centralServerService, 'general.error_backend');
          // Error
          observer.error(error);
        });
    },
    );
  }

  public buildTableDef(): TableDef {
    return {
      search: {
        enabled: true,
      },
      rowDetails: {
        enabled: true,
        angularComponent: ConsumptionChartDetailComponent,
      },
      hasDynamicRowAction: true
    };
  }

  public buildTableColumnDefs(): TableColumnDef[] {
    const columns: TableColumnDef[] = [];
    if (this.isAdmin) {
      columns.push({
        id: 'id',
        name: 'transactions.id',
        headerClass: 'col-10p',
        class: 'col-10p',
      });
    }
    columns.push(
      {
        id: 'tagID',
        name: 'transactions.badge_id',
        headerClass: 'col-15p',
        class: 'text-left col-15p',
      },
      {
        id: 'chargeBoxID',
        name: 'transactions.charging_station',
        headerClass: 'col-15p',
        class: 'text-left col-15p',
        formatter: (chargingStationID: string, connector: Connector) => this.formatChargingStation(chargingStationID, connector),
      },
      {
        id: 'timestamp',
        name: 'transactions.started_at',
        headerClass: 'col-15p',
        class: 'text-left col-15p',
        sorted: true,
        sortable: true,
        direction: 'desc',
        formatter: (value: Date) => this.datePipe.transform(value),
      },
      {
        id: 'stop.totalDurationSecs',
        name: 'transactions.duration',
        headerClass: 'col-10p',
        class: 'text-left col-10p',
        formatter: (totalDurationSecs: number) => this.appDurationPipe.transform(totalDurationSecs),
      },
      {
        id: 'stop.totalInactivitySecs',
        name: 'transactions.inactivity',
        headerClass: 'col-10p',
        class: 'col-10p',
        sortable: false,
        isAngularComponent: true,
        angularComponent: TransactionsInactivityCellComponent,
      },
      {
        id: 'stop.totalConsumptionWh',
        name: 'transactions.consumption',
        headerClass: 'col-10p',
        class: 'col-10p',
        formatter: (totalConsumptionWh: number) => this.appUnitPipe.transform(totalConsumptionWh, 'Wh', 'kWh'),
      },
      {
        id: 'stateOfCharge',
        name: 'transactions.state_of_charge',
        headerClass: 'col-10p',
        class: 'col-10p',
        formatter: (stateOfCharge: number, row: Transaction) => stateOfCharge ? `${stateOfCharge}% > ${row.stop.stateOfCharge}%` : '-',
      },
    );
    if (this.isAdmin || this.isSiteAdmin) {
      columns.splice(1, 0, {
        id: 'user',
        name: 'transactions.user',
        headerClass: 'col-15p',
        class: 'text-left col-15p',
        formatter: (user: User) => this.appUserNamePipe.transform(user),
      });
    }
    if (this.componentService.isActive(TenantComponents.PRICING)) {
      columns.push({
        id: 'stop.price',
        name: 'transactions.price',
        headerClass: 'col-10p',
        class: 'col-10p',
        formatter: (price: number, transaction: Transaction) => this.appCurrencyPipe.transform(price, transaction.stop.priceUnit),
      });
    }
    if (this.componentService.isActive(TenantComponents.BILLING)) {
      columns.push({
        id: 'billingData.invoiceID',
        name: 'invoices.id',
        headerClass: 'text-center col-10p',
        class: 'col-10p',
        formatter: (invoiceID: string) => invoiceID ? invoiceID : '-',
      });
    }
    return columns;
  }

  public formatInactivity(totalInactivitySecs: number, row: Transaction) {
    let percentage = 0;
    if (row.stop) {
      percentage = row.stop.totalDurationSecs > 0 ? (totalInactivitySecs / row.stop.totalDurationSecs) : 0;
    }
    return this.appDurationPipe.transform(totalInactivitySecs) +
      ` (${this.appPercentPipe.transform(percentage, '1.0-0')})`;
  }

  public formatChargingStation(chargingStationID: string, connector: Connector) {
    return `${chargingStationID} - ${this.appConnectorIdPipe.transform(connector.connectorId)}`;
  }

  public buildTableFooterStats(data: TransactionDataResult): string {
    // All records has been retrieved
    if (data.count !== Constants.INFINITE_RECORDS) {
      // Stats?
      if (data.stats) {
        const percentInactivity = (data.stats.totalDurationSecs > 0 ?
          (Math.floor(data.stats.totalInactivitySecs / data.stats.totalDurationSecs * 100)) : 0);
        // Total Duration
        // tslint:disable-next-line:max-line-length
        let stats = `${this.translateService.instant('transactions.duration')}: ${this.appDurationPipe.transform(data.stats.totalDurationSecs)} | `;
        // Inactivity
        // tslint:disable-next-line:max-line-length
        stats += `${this.translateService.instant('transactions.inactivity')}: ${this.appDurationPipe.transform(data.stats.totalInactivitySecs)} (${percentInactivity}%) | `;
        // Total Consumption
        // tslint:disable-next-line:max-line-length
        stats += `${this.translateService.instant('transactions.consumption')}: ${this.appUnitPipe.transform(data.stats.totalConsumptionWattHours, 'Wh', 'kWh', true, 1, 0, 0)}`;
        // Total Price
        // tslint:disable-next-line:max-line-length
        stats += ` | ${this.translateService.instant('transactions.price')}: ${this.appCurrencyPipe.transform(data.stats.totalPrice, data.stats.currency)}`;
        return stats;
      }
    }
    return '';
  }

  public buildTableFiltersDef(): TableFilterDef[] {
    const filters: TableFilterDef[] = [
      new IssuerFilter().getFilterDef(),
      new StartDateFilter(moment().startOf('y').toDate()).getFilterDef(),
      new EndDateFilter().getFilterDef(),
      new ChargingStationTableFilter().getFilterDef(),
      new TransactionsInactivityStatusFilter().getFilterDef(),
    ];
    // Show Site Area Filter If Organization component is active
    if (this.componentService.isActive(TenantComponents.ORGANIZATION)) {
      filters.push(new SiteTableFilter().getFilterDef());
      filters.push(new SiteAreaTableFilter().getFilterDef());
    }
    if (this.authorizationService.isAdmin() || this.authorizationService.hasSitesAdminRights()) {
      filters.push(new UserTableFilter(this.authorizationService.getSitesAdmin()).getFilterDef());
    }
    return filters;
  }

  public buildTableDynamicRowActions(transaction: Transaction): TableActionDef[] {
    const rowActions: TableActionDef[] = [this.viewAction];
    if (this.isAdmin) {
      const moreActions = new TableMoreAction([]);
      moreActions.addActionInMoreActions(this.deleteAction);
      moreActions.addActionInMoreActions(this.checkLogsAction);
      if (this.componentService.isActive(TenantComponents.BILLING) &&
        !transaction.billingData) {
        moreActions.addActionInMoreActions(this.createInvoice);
      }
      if (transaction.ocpiData && !transaction.ocpiData.cdr) {
        moreActions.addActionInMoreActions(this.pushCdr);
      }
      // Enable only for one user for the time being
      if (this.centralServerService.getLoggedUser().email === 'serge.fabiano@sap.com') {
        moreActions.addActionInMoreActions(this.rebuildTransactionConsumptionsAction);
      }
      rowActions.push(moreActions.getActionDef());
    }
    return rowActions;
  }

  public canDisplayRowAction(actionDef: TableActionDef, transaction: Transaction) {
    switch (actionDef.id) {
      case TransactionButtonAction.DELETE_TRANSACTION:
        return this.isAdmin;
      case TransactionButtonAction.REFUND_TRANSACTIONS:
        return !Utils.objectHasProperty(transaction, 'refund');
      default:
        return true;
    }
  }

  public rowActionTriggered(actionDef: TableActionDef, transaction: Transaction) {
    switch (actionDef.id) {
      case TransactionButtonAction.DELETE_TRANSACTION:
        if (actionDef.action) {
          (actionDef as TableDeleteTransactionActionDef).action(
            transaction, this.dialogService, this.translateService, this.messageService,
            this.centralServerService, this.spinnerService, this.router, this.refreshData.bind(this));
        }
        break;
      case TransactionButtonAction.VIEW_TRANSACTION:
        if (actionDef.action) {
          (actionDef as TableViewTransactionActionDef).action(transaction, this.dialog, this.refreshData.bind(this));
        }
        break;
      case LogButtonAction.CHECK_LOGS:
        this.checkLogsAction.action('logs?search=' + transaction.id);
        break;
      case TransactionButtonAction.CREATE_TRANSACTION_INVOICE:
        if (actionDef.action) {
          (actionDef as TableCreateTransactionInvoiceActionDef).action(
            transaction.id, this.dialogService, this.translateService, this.messageService,
            this.centralServerService, this.spinnerService, this.router, this.refreshData.bind(this));
        }
        break;
      case TransactionButtonAction.REBUILD_TRANSACTION_CONSUMPTIONS:
        if (actionDef.action) {
          (actionDef as TableRebuildTransactionConsumptionsActionDef).action(
            transaction, this.dialogService, this.translateService, this.messageService,
            this.centralServerService, this.router, this.spinnerService);
        }
        break;
      case TransactionButtonAction.PUSH_TRANSACTION_CDR:
        if (actionDef.action) {
          (actionDef as TableRoamingPushCdrActionDef).action(
            transaction, this.dialogService, this.translateService, this.messageService,
            this.centralServerService, this.spinnerService, this.router, this.refreshData.bind(this));
        }
        break;
    }
  }

  public buildTableActionsRightDef(): TableActionDef[] {
    return [
      new TableAutoRefreshAction(false).getActionDef(),
      new TableRefreshAction().getActionDef(),
    ];
  }

  public buildTableActionsDef(): TableActionDef[] {
    const tableActionsDef = super.buildTableActionsDef();
    if (!this.authorizationService.isDemo()) {
      return [
        new TableExportTransactionsAction().getActionDef(),
        ...tableActionsDef,
      ];
    }
    return tableActionsDef;
  }

  public actionTriggered(actionDef: TableActionDef) {
    switch (actionDef.id) {
      case TransactionButtonAction.EXPORT_TRANSACTIONS:
        if (actionDef.action) {
          (actionDef as TableExportTransactionsActionDef).action(this.buildFilterValues(), this.dialogService,
            this.translateService, this.messageService, this.centralServerService, this.router,
            this.spinnerService);
        }
        break;
    }
  }
}
