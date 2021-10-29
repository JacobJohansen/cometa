import { Component, Inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { FeaturesState } from '@store/features.state';
import { map } from 'rxjs/operators';
import { ApiService } from '@services/api.service';
import { Observable, NEVER } from 'rxjs';
import { ConfigService } from '@services/config.service';
import { Features } from '@store/actions/features.actions';
import { MixpanelService } from '@services/mixpanel.service';

@Component({
  selector: 'cometa-move-item',
  templateUrl: './move-item.component.html',
  styleUrls: ['./move-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoveItemDialog implements OnInit {

  homeFolder$: Observable<Folder>;

  previousFolderId: number;

  constructor(
    private dialogRef: MatDialogRef<MoveItemDialog>,
    @Inject(MAT_DIALOG_DATA) public data: IMoveData,
    public _config: ConfigService,
    private _store: Store,
    private _api: ApiService,
    private _mixpanel: MixpanelService
  ) {
    this.previousFolderId = this.data.type === 'feature' ? this.data.feature.folder_id : this.data.folder.folder_id;
    this._config.selectedFolderId.next(this.previousFolderId);
    this.homeFolder$ = this._store.select(FeaturesState.GetFolders).pipe(
      map(folders => ({
        features: [],
        folder_id: null,
        folders: folders,
        name: 'Home',
        owner: null,
        parent_id: null
      }))
    );
  }

  ngOnInit() {
    this._mixpanel.track('Move feature', { feature: this.data.feature });
  }

  changeFolder() {
    let req: Observable<any>;
    switch (this.data.type) {
      case 'feature':
        req = this._api.moveFeatureFolder(
          this.previousFolderId,
          this._config.selectedFolderId.getValue() || 0,
          this.data.feature.feature_id
        )
        break;
      case 'folder':
        req = this._api.modifyFolder({
          folder_id: this.data.folder.folder_id,
          parent_id: this._config.selectedFolderId.getValue() || null
        })
        break;
      default:
        req = NEVER;
    }
    req.subscribe(_ => {
      this._store.dispatch( new Features.GetFolders );
      this.dialogRef.close();
    });
  }

}
