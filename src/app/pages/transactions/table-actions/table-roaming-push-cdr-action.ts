import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CentralServerService } from 'app/services/central-server.service';
import { DialogService } from 'app/services/dialog.service';
import { MessageService } from 'app/services/message.service';
import { SpinnerService } from 'app/services/spinner.service';
import { TableAction } from 'app/shared/table/actions/table-action';
import { ActionsResponse } from 'app/types/DataResult';
import { ButtonColor, ButtonType, TableActionDef } from 'app/types/Table';
import { Transaction, TransactionButtonAction } from 'app/types/Transaction';
import { Utils } from 'app/utils/Utils';
import { Observable } from 'rxjs';

export interface TableRoamingPushCdrActionDef extends TableActionDef {
  action: (transaction: Transaction, dialogService: DialogService, translateService: TranslateService,
    messageService: MessageService, centralServerService: CentralServerService,
    spinnerService: SpinnerService, router: Router, refresh: () => Observable<void>) => void;
}

export class TableRoamingPushCdrAction implements TableAction {
  private action: TableRoamingPushCdrActionDef = {
    id: TransactionButtonAction.PUSH_TRANSACTION_CDR,
    type: 'button',
    icon: 'cloud_upload',
    color: ButtonColor.PRIMARY,
    name: 'general.tooltips.push_cdr',
    tooltip: 'general.tooltips.push_cdr',
    action: this.pushCdr,
  };

  // Return an action
  public getActionDef(): TableRoamingPushCdrActionDef {
    return this.action;
  }

  public pushCdr(transaction: Transaction, dialogService: DialogService, translateService: TranslateService,
      messageService: MessageService, centralServerService: CentralServerService, spinnerService: SpinnerService,
      router: Router, refresh: () => Observable<void>) {
    dialogService.createAndShowYesNoDialog(
      translateService.instant('transactions.dialog.roaming.title'),
      translateService.instant('transactions.dialog.roaming.confirm', { sessionID: transaction.id }),
    ).subscribe((response) => {
      if (response === ButtonType.YES) {
        spinnerService.show();
        centralServerService.pushTransactionCdr(transaction.id).subscribe((response: ActionsResponse) => {
          spinnerService.hide();
          if (response.inError) {
            messageService.showErrorMessage(
              translateService.instant('transactions.notification.roaming.error'));
          } else {
            messageService.showSuccessMessage(
              translateService.instant('transactions.notification.roaming.success'));
            if (refresh) {
              refresh().subscribe();
            }
          }
        }, (error: any) => {
          spinnerService.hide();
          Utils.handleHttpError(error, router, messageService,
            centralServerService, 'transactions.notification.roaming.error');
        });
      }
    });
  }
}