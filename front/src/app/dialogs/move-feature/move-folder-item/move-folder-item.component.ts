import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ApiService } from '@services/api.service';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { EnterValueComponent } from '@dialogs/enter-value/enter-value.component';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { Subscribe } from 'app/custom-decorators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from '@services/config.service';
import { Features } from '@store/actions/features.actions';
import { AddFolderComponent } from '@dialogs/add-folder/add-folder.component';

@Component({
  selector: 'cometa-move-folder-item',
  templateUrl: './move-folder-item.component.html',
  styleUrls: ['./move-folder-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoveFolderItemComponent {

  constructor(
    public _config: ConfigService,
    private _api: ApiService,
    private _store: Store,
    private _dialog: MatDialog,
    private _snackBar: MatSnackBar
  ) { }

  extended$ = this._config.openedFolders.pipe(
    map(folders => folders.includes(this.folder.folder_id) || this.folder.folder_id === null)
  );

  @Input() child: number;

  @Input() folder: Folder;

  selectFolder() {
    let openedFolders = this._config.openedFolders.getValue();
    if (openedFolders.includes(this.folder.folder_id)) {
      // Remove it from the opened folders
      openedFolders = openedFolders.filter(folder_id => folder_id !== this.folder.folder_id);
    } else {
      // Add it to the opened folders
      openedFolders.push(this.folder.folder_id);
    }
    this._config.openedFolders.next(openedFolders);
    this._config.selectedFolderId.next(this.folder.folder_id);
  }

  @Subscribe()
  createFolder() {
    return this._dialog.open(EnterValueComponent, {
      autoFocus: true,
      data: {
        word: 'Folder'
      }
    })
    .afterClosed()
    .pipe(
      switchMap(res => this._api.createFolder(res.value, this.folder.folder_id).pipe(
        map(() => res)
      )),
      switchMap(res => this._store.dispatch( new Features.GetFolders ).pipe(
        map(() => res)
      )),
      tap(folder => {
        const openedFolders = this._config.openedFolders.getValue();
        openedFolders.push(this.folder.folder_id);
        this._config.openedFolders.next(openedFolders);
        this._snackBar.open(`Folder ${folder.value} created`, 'OK');
      })
    );
  }

  modifyFolder() {
    return this._dialog.open(AddFolderComponent, {
      autoFocus: true,
      data: {
        mode: 'edit',
        folder: this.folder
      } as IEditFolder
    })
    .afterClosed()
    .pipe(
      filter((res: boolean) => !!res),
      switchMap(_ => this._store.dispatch( new Features.GetFolders )),
    ).subscribe(_ => {
      const openedFolders = this._config.openedFolders.getValue();
      openedFolders.push(this.folder.folder_id);
      this._config.openedFolders.next(openedFolders);
      this._snackBar.open(`Folder modified successfully`, 'OK');
    })
  }

  @Subscribe()
  deleteFolder() {
    return this._api.removeFolder(this.folder.folder_id).pipe(
      switchMap(_ => this._store.dispatch( new Features.GetFolders )),
      tap(_ => this._snackBar.open(`Folder ${this.folder.name} removed`, 'OK'))
    );
  }

}
