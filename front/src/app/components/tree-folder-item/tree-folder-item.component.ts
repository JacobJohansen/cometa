import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { Select, Store } from '@ngxs/store';
import { CustomSelectors } from '@others/custom-selectors';
import { MixpanelService } from '@services/mixpanel.service';
import { Configuration } from '@store/actions/config.actions';
import { Features } from '@store/actions/features.actions';
import { FeaturesState } from '@store/features.state';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'cometa-tree-folder-item',
  templateUrl: './tree-folder-item.component.html',
  styleUrls: ['./tree-folder-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeFolderItemComponent implements OnInit {

  constructor(
    private _store: Store,
    private _mixpanel: MixpanelService
  ) { }

  @Input() folder: Folder;
  @Input() level: number;
  @Input() parent: Folder[] = [];
  @Select(FeaturesState.GetLastFolder) lastFolder$: Observable<ReturnType<typeof FeaturesState.GetLastFolder>>;
  @Select(CustomSelectors.GetConfigProperty('openedSidenav')) showFolders$: Observable<boolean>;

  expanded$: BehaviorSubject<boolean>;

  ngOnInit() {
    if (this.folder.folder_id === 0) {
      this.expanded$ = new BehaviorSubject<boolean>(true);
    } else {
      this.expanded$ = new BehaviorSubject<boolean>(false);
    }
    const isFolderInRoute = this._store.selectSnapshot(CustomSelectors.IsFolderInRoute(this.folder));
    if (isFolderInRoute) {
      this.expanded$.next(true);
    }
  }

  /**
   * Function to toggle expanded state of current folder
   * @param canClose If the current folder should close
   */
  toggleRow(canClose: boolean) {
    let status = !this.expanded$.getValue();
    if (!canClose && !status) {
      return
    }
    this.expanded$.next(status);
  }

  toggleExpandFromArrow(event: MouseEvent) {
    this.toggleRow(true);
    event.stopPropagation();
  }

  // Hides the sidenav on mobile
  @Dispatch() toggleSidenav() {
    if (window.innerWidth > 600) {
      return new Configuration.SetProperty('openedSidenav', false);
    }
    const opened = this._store.selectSnapshot<boolean>(CustomSelectors.GetConfigProperty('openedSidenav'));
    return new Configuration.SetProperty('openedSidenav', !opened);
  }

  // Hides the search if active
  @Dispatch() toggleSearch() {
    return new Configuration.SetProperty('openedSearch', false);
  }

  // Changes the current folder and closes every active expandable
  toggleExpand() {
    this._mixpanel.track('Open folder', { folder: this.folder })
    this.toggleRow(false); // Don't close when clicking into folder icon or text
    if (this.folder.folder_id == 0) {
      this._store.dispatch(new Features.ReturnToFolderRoute(0));
    } else {
      this._store.dispatch(new Features.SetFolderRoute(this.parent));
    }
    this.toggleSidenav();
    this.toggleSearch();
  }

}
