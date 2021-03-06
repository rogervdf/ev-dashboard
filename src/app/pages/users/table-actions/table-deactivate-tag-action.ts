import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CentralServerService } from 'app/services/central-server.service';
import { DialogService } from 'app/services/dialog.service';
import { MessageService } from 'app/services/message.service';
import { SpinnerService } from 'app/services/spinner.service';
import { TableDeactivateAction } from 'app/shared/table/actions/table-deactivate-action';
import { RestResponse } from 'app/types/GlobalType';
import { ButtonType, TableActionDef } from 'app/types/Table';
import { Tag } from 'app/types/Tag';
import { UserButtonAction } from 'app/types/User';
import { Utils } from 'app/utils/Utils';
import { Observable } from 'rxjs';

export interface TableDeactivateTagActionDef extends TableActionDef {
  action: (tag: Tag, dialogService: DialogService, translateService: TranslateService, messageService: MessageService,
    centralServerService: CentralServerService, spinnerService: SpinnerService, router: Router, refresh?: () => Observable<void>) => void;
}

export class TableDeactivateTagAction extends TableDeactivateAction {
  public getActionDef(): TableDeactivateTagActionDef {
    return {
      ...super.getActionDef(),
      id: UserButtonAction.DEACTIVATE_TAG,
      action: this.deactivateTag,
    };
  }

  private deactivateTag(tag: Tag, dialogService: DialogService, translateService: TranslateService, messageService: MessageService,
    centralServerService: CentralServerService, spinnerService: SpinnerService, router: Router, refresh?: () => Observable<void>) {
    dialogService.createAndShowYesNoDialog(
      translateService.instant('tags.deactivate_title'),
      translateService.instant('tags.deactivate_confirm', { tagID: tag.id }),
    ).subscribe((response) => {
      if (response === ButtonType.YES) {
        spinnerService.show();
        const tagUpdated: Tag = {
          id: tag.id,
          issuer: tag.issuer,
          description: tag.description,
          userID: tag.userID,
          active: false,
        } as Tag;
        centralServerService.updateTag(tagUpdated).subscribe((actionResponse) => {
          spinnerService.hide();
          if (actionResponse.status === RestResponse.SUCCESS) {
            messageService.showSuccessMessage('tags.deactivate_success', { tagID: tag.id });
            if (refresh) {
              refresh().subscribe();
            }
          } else {
            Utils.handleError(JSON.stringify(response), messageService, 'tags.deactivate_error');
          }
        }, (error) => {
          spinnerService.hide();
          Utils.handleHttpError(error, router, messageService, centralServerService, 'tags.deactivate_error');
        });
      }
    });
  }
}
