import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { Select, Store } from '@ngxs/store';
import { CustomSelectors } from '@others/custom-selectors';
import { FeatureFilledInfo } from '@pipes/fill-feature-info.pipe';
import { SharedActionsService } from '@services/shared-actions.service';
import { Configuration } from '@store/actions/config.actions';
import { Observable } from 'rxjs';

@Component({
  selector: 'cometa-new-feature-list',
  templateUrl: './new-feature-list.component.html',
  styleUrls: ['./new-feature-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewFeatureListComponent {

  @Select(CustomSelectors.GetConfigProperty('sorting')) sorting$: Observable<string>;
  @Select(CustomSelectors.GetConfigProperty('reverse')) reverse$: Observable<boolean>;

  constructor(
    public _sharedActions: SharedActionsService,
    private _store: Store
  ) { }

  displayedColumns = [
    {name: "ID", key: "feature_id"},
    {name: "Name", key: "feature_name"},
    {name: "Status", key: "status"},
    {name: "Last run", key: "execution"},
    {name: "Last duration", key: "duration"},
    {name: "Last steps", key: "last_edited"},
    {name: "Department", key: null},
    {name: "Application", key: null},
    {name: "Environment", key: null},
    {name: "Browsers", key: null},
    {name: "Scheduled", key: null}
  ]

  @Input() features: number[];

  @Input() dependsOnOther: boolean;

  trackId = (i, item: FeatureFilledInfo) => item.id;

  @Dispatch()
  setSorting(field) {
    if (!field)
      return [];
    const previousField = this._store.selectSnapshot<string>(CustomSelectors.GetConfigProperty('sorting'));
    let reverse = this._store.selectSnapshot<boolean>(CustomSelectors.GetConfigProperty('reverse'));
    reverse = previousField === field ? !reverse : false;
    return [
      new Configuration.SetProperty('sorting', field),
      new Configuration.SetProperty('reverse', reverse)
    ];
  }

  trackBrowser = (i, item: BrowserstackBrowser) => JSON.stringify(item);

}
