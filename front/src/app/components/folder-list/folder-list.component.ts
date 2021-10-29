import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddFolderComponent } from '@dialogs/add-folder/add-folder.component';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { Store } from '@ngxs/store';
import { ApiService } from '@services/api.service';
import { SharedActionsService } from '@services/shared-actions.service';
import { Features } from '@store/actions/features.actions';
import { Subscribe } from 'ngx-amvara-toolbox';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'cometa-folder-list',
  templateUrl: './folder-list.component.html',
  styleUrls: ['./folder-list.component.scss']
})
export class FolderListComponent {

  constructor(
    private _store: Store,
    private _dialog: MatDialog,
    private _api: ApiService,
    private _snackBar: MatSnackBar,
    public _sharedActions: SharedActionsService
  ) { }

  @Input() folder: Folder;
  @Input() folders: any;

  // Opens a folder
  @Dispatch() open = () => new Features.AddFolderRoute(this.folder)

  // Opens a dialog to modify an already existing folder
  modify() {
    this._dialog.open(AddFolderComponent, {
      autoFocus: true,
      data: {
        mode: 'edit',
        folder: this.folder
      } as IEditFolder
    })
  }

  // Deletes a folder
  @Subscribe()
  delete() {
    return this._api.removeFolder(this.folder.folder_id).pipe(
      switchMap(_ => this._store.dispatch( new Features.GetFolders )),
      tap(_ => this._snackBar.open(`Folder ${this.folder.name} removed`, 'OK'))
    );
  }


  displayedColumns = [
    {name: "Name"},
    {name: "Department"}
  ]

}
