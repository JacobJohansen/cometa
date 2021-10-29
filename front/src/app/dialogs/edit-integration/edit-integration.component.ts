import { Component, ChangeDetectionStrategy, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ViewSelectSnapshot } from '@ngxs-labs/select-snapshot';
import { Store } from '@ngxs/store';
import { ApiService } from '@services/api.service';
import { MixpanelService } from '@services/mixpanel.service';
import { SharedActionsService } from '@services/shared-actions.service';
import { Integrations } from '@store/actions/integrations.actions';
import { UserState } from '@store/user.state';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'edit-integration',
  templateUrl: './edit-integration.component.html',
  styleUrls: ['./edit-integration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditIntegrationDialog implements OnInit {

  @ViewSelectSnapshot(UserState.RetrieveUserDepartments) departments: Department[];
  @ViewSelectSnapshot(UserState.RetrieveIntegrationApps) integrations: string[];

  intForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<EditIntegrationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: IntegrationDialogData,
    private _fb: FormBuilder,
    private _api: ApiService,
    private _sharedActions: SharedActionsService,
    private _store: Store,
    private _mixpanel: MixpanelService
  ) { }

  ngOnInit() {
    // Get send_on if comes from edit
    let sendOn = 'after_test_execution';
    if (this.data.integration?.send_on) {
      sendOn = Object.entries(this.data.integration.send_on).find(entry => !!entry[1])[0];
    }
    // Create integration form
    this.intForm = this._fb.group({
      application: [this.data.integration?.application || 'Discord', Validators.required],
      department_id: [this.data.integration?.department?.department_id || (this.departments.length === 1 ? this.departments[0].department_id : null), Validators.required],
      hook: [this.data.integration?.hook || '', Validators.compose([Validators.required, Validators.pattern(/^(http|https):\/\//i)])],
      send_on: [sendOn, Validators.required]
    })
  }

  createOrEdit(values) {
    // Construct send_on object
    const option = values.send_on;
    values.send_on = {
      [option]: true
    }
    // Check type of dialog action
    if (this.data.type === 'new') {
      // Create new integration
      this._sharedActions.loadingObservable(
        this._api.createIntegration(values),
        'Creating integration'
      ).pipe(
        switchMap(int => this._store.dispatch( new Integrations.AddOne(int) ))
      ).subscribe({
        complete: () => {
          this._mixpanel.track('Created integration')
          this.dialogRef.close()
        }
      });
    } else {
      // Modify existing integration
      this._sharedActions.loadingObservable(
        this._api.patchIntegration(this.data.integration.id, values),
        'Modifying integration'
      ).pipe(
        switchMap(int => this._store.dispatch( new Integrations.PatchOne(int)))
      ).subscribe({
        complete: () => {
          this._mixpanel.track('Edited integration')
          this.dialogRef.close()
        }
      })
    }
  }

}

export interface IntegrationDialogData {
  type: 'new' | 'edit';
  integration?: Integration;
}