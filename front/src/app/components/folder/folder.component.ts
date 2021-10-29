import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '@services/api.service';
import { switchMap, tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscribe } from 'app/custom-decorators';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { Features } from '@store/actions/features.actions';
import { AddFolderComponent } from '@dialogs/add-folder/add-folder.component';
import { SharedActionsService } from '@services/shared-actions.service';
import { MixpanelService } from '@services/mixpanel.service';

@Component({
  selector: 'cometa-folder',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FolderComponent {

  constructor(
    private _store: Store,
    private _dialog: MatDialog,
    private _api: ApiService,
    private _snackBar: MatSnackBar,
    public _sharedActions: SharedActionsService,
    private _mixpanel: MixpanelService
  ) { }

  @Input() folder: Folder;

  @Dispatch() open = () => {
    new Features.AddFolderRoute(this.folder)
  }

  modify() {
    this._mixpanel.track('Modify folder')
    this._dialog.open(AddFolderComponent, {
      autoFocus: true,
      data: {
        mode: 'edit',
        folder: this.folder
      } as IEditFolder
    })
  }

  @Subscribe()
  delete() {
    this._mixpanel.track('Delete folder', { folder: this.folder })
    return this._api.removeFolder(this.folder.folder_id).pipe(
      switchMap(_ => this._store.dispatch( new Features.GetFolders )),
      tap(_ => this._snackBar.open(`Folder ${this.folder.name} removed`, 'OK'))
    );
  }

}
