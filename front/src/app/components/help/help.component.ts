import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { ConfigState } from '@store/config.state';
import { ActionsState } from '@store/actions.state';
import { Observable } from 'rxjs';
import { MixpanelService } from '@services/mixpanel.service';

@Component({
  selector: 'cometa-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpComponent implements OnInit {

  constructor(
    private _mixpanel: MixpanelService
  ) { }

  @Select(ActionsState) actions$: Observable<Action[]>;
  @Select(ConfigState) config$: Observable<Config>;

  hotkeys = [
    { hotkey: 'ESC', text: 'Quit' },
    { hotkey: 'Space', text: 'Run Feature' },
    { hotkey: 'E', text: 'Edit Feature' },
    { hotkey: 'L', text: 'Show Log Output' },
    { hotkey: 'N', text: 'Enable/Disable notifications' },
    { hotkey: 'S', text: 'Edit Schedule' },
    { hotkey: 'Ctrl + F11', text: 'Log App State'}
  ]

  ngOnInit() {
    this._mixpanel.track('Go page Help');
  }

}
