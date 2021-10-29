import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { UserState } from '@store/user.state';
import { ConfigState } from '@store/config.state';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Tour, TourExtended, Tours } from '@services/tours';
import { ViewSelectSnapshot } from '@ngxs-labs/select-snapshot';
import { Observable } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { map } from 'rxjs/operators';
import { TourService } from '@services/tour.service';
import { MatDialog } from '@angular/material/dialog';
import { InviteUserDialog } from '@dialogs/invite-user/invite-user.component';
import { SharedActionsService } from '@services/shared-actions.service';
import { IntegrationsState } from '@store/integrations.state';
import { ApiService } from '@services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Integrations } from '@store/actions/integrations.actions';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { Configuration } from '@store/actions/config.actions';
import { User } from '@store/actions/user.actions';
import { MixpanelService } from '@services/mixpanel.service';

@Component({
  selector: 'account-settings',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserComponent implements OnInit {

  @Select(UserState) account$: Observable<UserInfo>;
  @ViewSelectSnapshot(ConfigState) config: Config;
  @Select(UserState.RetrieveSettings) settings$: Observable<UserInfo['settings']>;
  @Select(UserState.IsDefaultDepartment) isDefaultDepartment$: Observable<boolean>;

  @ViewSelectSnapshot(IntegrationsState.ByDepartment) integrationsDept: IntegrationByDepartment;

  tours$: Observable<TourExtended[]>

  details$: Observable<UserDetails>;
  invoices$: Observable<UsageInvoice[]>;

  constructor(
    private _tours: Tours,
    private _tourService: TourService,
    private _dialog: MatDialog,
    public _sharedActions: SharedActionsService,
    private _api: ApiService,
    private _snack: MatSnackBar,
    private _store: Store,
    private _mixpanel: MixpanelService
  ) { 
    this.tours$ = this.settings$.pipe(
      map(settings => {
        return Object.entries(this._tours)
              // Remove injected services
              .filter(entry => !entry[0].startsWith('_'))
              // Map to value
              .map(entry => entry[1])
              // Add custom properties
              .map((tour: Tour) => {
                let completed
                try {
                  completed = settings.tours_completed[tour.id] >= tour.version
                } catch (err) {
                  completed = false
                }
                return {
                    ...tour,
                    completed: completed
                }
              })
      })
    )
  }

  goInvoice(invoiceId: number) {
    this._api.getInvoiceUrl(invoiceId).subscribe(res => {
      if (res.success && res.url) window.open(res.url);
    })
  }

  ngOnInit() {
    this._mixpanel.track('Go page User')
    this.details$ = this._api.getUserDetails();
    this.invoices$ = this._api.getInvoices();
  }

  removeIntegration(id: number) {
    this._sharedActions.loadingObservable(
      this._api.deleteIntegration(id),
      'Deleting integration'
    ).subscribe({
      next: () => {
        this._store.dispatch( new Integrations.RemoveOne(id) )
        this._mixpanel.track('Deleted integration')
      },
      error: () => this._snack.open('An error ocurred', 'OK')
    })
  }

  goCustomerPortal() {
    this._api.generateCustomerPortal().subscribe(response => {
      if (response.success) {
        location.href = response.url;
      }
    })
  }

  inviteUser() {
    this._dialog.open(InviteUserDialog);
  }

  startTour(tour: Tour) {
    this._tourService.startTourById(tour.id, true)
  }

  @Dispatch()
  handleDisableAnimations(e: MatCheckboxChange) {
    localStorage.setItem('da', e.checked ? 'yes' : 'no');
    return new Configuration.SetProperty('disableAnimations', e.checked);
  }

  @Dispatch()
  handlePercentMode() {
    return new Configuration.ChangePercentMode();
  }

  @Dispatch()
  handleToggle(ev: MatCheckboxChange, prop) {
    return new Configuration.ToggleCollapsible(prop, ev.checked);
  }

  @Dispatch()
  handleAccountSetting(ev: any, prop) {
    // Handle any change in any option
    if (ev.hasOwnProperty('checked')) {
      // Add exception if for Budgets
      if (prop === 'enable_budget' && ev.checked) {
        return new User.SetSetting({
            budget: this._store.selectSnapshot(UserState.RetrieveSettings).budget || 0,
            enable_budget: ev.checked,
            budget_schedule_behavior: this._store.selectSnapshot(UserState.RetrieveSettings).budget_schedule_behavior || 'prevent'
        })
      }
      // Handle as checkbox
      return new User.SetSetting({ [prop]: ev.checked });
    } else if (ev.hasOwnProperty('value')) {
      // Handle as radio
      return new User.SetSetting({ [prop]: ev.value });
    } else {
      // Handle as input
      let value: any = ev.target.value;
      value = isNaN(value) ? value : parseFloat(value);
      return new User.SetSetting({ [prop]: value });
    }
  }
}
