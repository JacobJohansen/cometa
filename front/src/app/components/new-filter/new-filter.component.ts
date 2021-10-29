import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { untilDestroyed } from '@ngneat/until-destroy';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { Select, Store } from '@ngxs/store';
import { CustomSelectors } from '@others/custom-selectors';
import { SharedActionsService } from '@services/shared-actions.service';
import { Configuration } from '@store/actions/config.actions';
import { Features } from '@store/actions/features.actions';
import { ApplicationsState } from '@store/applications.state';
import { EnvironmentsState } from '@store/environments.state';
import { FeaturesState } from '@store/features.state';
import { UserState } from '@store/user.state';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'cometa-new-filter',
  templateUrl: './new-filter.component.html',
  styleUrls: ['./new-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewFilterComponent implements OnInit {

  constructor(
    public _sharedActions: SharedActionsService,
    private _store: Store
  ) { }

  @Select(FeaturesState.GetSelectionFolders) currentRoute$: Observable<ReturnType<typeof FeaturesState.GetSelectionFolders>>;
  @Select(FeaturesState.GetFilters) filters$: Observable<ReturnType<typeof FeaturesState.GetFilters>>;
  @Select(UserState.RetrieveUserDepartments) departments$: Observable<ReturnType<typeof UserState.RetrieveUserDepartments>>;
  @Select(ApplicationsState) applications$: Observable<Application[]>;
  @Select(EnvironmentsState) environments$: Observable<Environment[]>;
  @Select(FeaturesState.GetFeaturesWithinFolder) features$: Observable<ReturnType<typeof FeaturesState.GetFeaturesWithinFolder>>;
  @Select(CustomSelectors.GetConfigProperty('openedSearch')) openedSearch$: Observable<boolean>;

  search = this._store.selectSnapshot<boolean>(CustomSelectors.GetConfigProperty('openedSearch'));

  searchInput: string;

  moreOrLessSteps = new FormControl('is');

  ngOnInit() {
    console.log('C.[32] -- Search var value ', this.search);
    this.moreOrLessSteps.valueChanges.pipe(
      untilDestroyed(this)
    ).subscribe(value => {
      this._store.dispatch( new Features.SetMoreOrLessSteps(value) );
    });
    this.openedSearch$.subscribe(value => this.search = value);
  }

  // Go to the parent folder whenever the breadcrumbs back arrow is clicked on mobile view
  @Dispatch()
  returnParent(folder: Partial<Folder>) {
    if (window.innerWidth < 600) {
      return new Features.ReturnToFolderRoute(folder.parent_id);
    }
  }

  // Go to the root / home folder
  @Dispatch()
  returnToRoot() {
      return new Features.ReturnToFolderRoute(0);
  }

  // Get the clicked folder id
  @Dispatch()
  returnFolder(folder: Partial<Folder>) {
    return new Features.ReturnToFolderRoute(folder.folder_id);
  }

  // Gets and sets the variable from config file to open/close the sidenav
  @Dispatch() toggleSidenav() {
    const opened = this._store.selectSnapshot<boolean>(CustomSelectors.GetConfigProperty('openedSidenav'));
    return new Configuration.SetProperty('openedSidenav', !opened);
  }

  // Gets and sets the variable from config file to open/close the search
  @Dispatch() toggleSearch() {
    this.search = !this.search;
    return new Configuration.SetProperty('openedSearch', this.search);
  }

  // Removes a filter and hides the feature list if the search bar is active
  @Dispatch()
  removeFilter(filter: Filter) {
    return new Features.RemoveFilter(filter);
  }

  // Checks which filter to add and if it's ok then add it
  @Dispatch()
  addFilterOK(id: string, value?: any, value2?: any) {
    const filters = this._store.selectSnapshot(CustomSelectors.GetConfigProperty('filters'));
    let customFilter = { ...filters.find(filter => filter.id === id) };
    switch (id) {
      case 'date':
        customFilter.range1 = value;
        customFilter.range2 = value2;
        console.log("C.[34] -- Entering here");
        break;
      case 'steps':
      case 'ok':
        customFilter.more = value2;
        customFilter.value = value;
        break;
      case 'help':
        break;
      default:
        customFilter.value = value;
    }
    // Check if filter requires a value
    if (customFilter.hasOwnProperty('value')) {
      this.dialogs[id].next(false);
    }
    this.toggleSearch();
    return new Features.AddFilter(customFilter);
  }

  // Adds a filter
  addFilter(filter: Filter) {
    // Check if filter requires a value
    if (filter.hasOwnProperty('value')) {
      this.dialogs[filter.id].next(true);
      setTimeout(() => {
        if (filter.id === 'test') {
          try {
            (document.querySelector('.dialog input[type=text]') as HTMLInputElement).focus();
          } catch (err) { }
        }
      })
    } else {
      this.addFilterOK('help')
    }
  }

  // Search the inputted feature in the input
  searchFeature() {
    if (this.searchInput) {
      this.addFilterOK('test', this.searchInput);
      this.searchInput = "";
    }
  }

  getId(item: Feature) {
    return item.feature_id;
  }

  // Shows the search input and calls the parent function to show the features-list
  open_search() {
    if (!this.search) {
      this.toggleSearch();
      (document.querySelector('.search-input-box') as HTMLInputElement).focus();
    } else {
      (document.querySelector('.search-input-box') as HTMLInputElement)
    }
  }

  // Hides the search input and calls the parent function to hide the features-list
  display_features() {
    this.toggleSearch();
    (document.querySelector('.search-input-box') as HTMLInputElement).value = "";

  }

  dialogs = {
    dept: new BehaviorSubject<boolean>(false),
    app: new BehaviorSubject<boolean>(false),
    env: new BehaviorSubject<boolean>(false),
    test: new BehaviorSubject<boolean>(false),
    steps: new BehaviorSubject<boolean>(false),
    date: new BehaviorSubject<boolean>(false),
    ok: new BehaviorSubject<boolean>(false),
    fails: new BehaviorSubject<boolean>(false),
    skipped: new BehaviorSubject<boolean>(false),
    department: new BehaviorSubject<boolean>(false),
    execution_time: new BehaviorSubject<boolean>(false),
    pixel_diff: new BehaviorSubject<boolean>(false)
  };
}
