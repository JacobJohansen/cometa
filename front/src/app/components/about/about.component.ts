import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigState } from '@store/config.state';
import { ViewSelectSnapshot } from '@ngxs-labs/select-snapshot';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { Configuration } from '@actions/config.actions';
import { SocketService } from '@services/socket.service';
import { Select } from '@ngxs/store';
import { CustomSelectors } from '@others/custom-selectors';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { MixpanelService } from '@services/mixpanel.service';
import { SharedActionsService } from '@services/shared-actions.service';

@Component({
  selector: 'cometa-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {

  @ViewSelectSnapshot(ConfigState) config$ !: Config;
  @Select(CustomSelectors.GetConfigProperty('serverInfo.version')) serverVersion$: Observable<string>;

  constructor(
    private _translate: TranslateService,
    private _snack: MatSnackBar,
    public _socketService: SocketService,
    private _router: Router,
    private _mixpanel: MixpanelService,
    public _sharedActions: SharedActionsService
  ) { }

  licenses = [
    ['Angular', 'https://github.com/angular/angular/blob/master/LICENSE', 'MIT License'],
    ['date-fns', 'https://date-fns.org/v1.9.0/docs/License', 'MIT License'],
    ['@ngx-translate', 'https://github.com/ngx-translate/core/blob/master/LICENSE', 'MIT License'],
    ['angular-svg-round-progressbar', 'https://github.com/crisbeto/angular-svg-round-progressbar/blob/master/LICENSE', 'MIT License'],
    ['Nginx', 'https://github.com/nginx/nginx/blob/master/docs/text/LICENSE', '2-Clause BSD License'],
    ['Postgres', 'https://github.com/postgres/postgres/blob/master/COPYRIGHT', 'PostgreSQL License (MIT-Like)'],
    ['Imagick', 'https://github.com/Imagick/imagick/blob/master/LICENSE', 'Open-Source License'],
    ['SLES', 'https://www.suse.com/es-es/licensing/', 'GNU-GPL License'],
    ['Django', 'https://github.com/django/django/blob/master/LICENSE', 'BSD License'],
    ['Behave', 'https://github.com/behave/behave/blob/master/LICENSE', 'BSD License'],
    ['Python', 'https://github.com/python/cpython/blob/master/LICENSE', 'Python Software Foundation License']
  ]

  ngOnInit() {
    this._mixpanel.track('Go page About');
  }

  @Dispatch()
  setLang(code: string) {
    this._mixpanel.track('Change language', { language: code })
    localStorage.setItem('lang', code);
    this._translate.use(code);
    this._snack.open('Language changed successfully!', 'OK');
    return new Configuration.SetProperty('language', code);
  }

  reloadLang() {
    this._mixpanel.track('Reload language')
    this._translate.reloadLang(this.config$.language);
    this._snack.open('Language reloaded successfully!', 'OK');
  }

  @Dispatch()
  toggleLogWebsockets(event: MatCheckboxChange) {
    this._sharedActions.trackCheckboxAction('Toggle log WebSockets', event.checked);
    return new Configuration.SetProperty('logWebsockets', event.checked, true);
  }

  @Dispatch()
  toggleNewDashboard(event: MatCheckboxChange) {
    this._sharedActions.trackCheckboxAction('Toggle new dashboard', event.checked);
    let routerConfig = this._router.config;
    routerConfig[0].redirectTo = event.checked ? 'new' : 'search';
    this._router.resetConfig(routerConfig);
    return new Configuration.SetProperty('useNewDashboard', event.checked, true);
  }

  showConfig = false;

}
