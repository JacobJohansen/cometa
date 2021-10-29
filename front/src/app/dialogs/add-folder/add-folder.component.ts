import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ViewSelectSnapshot } from '@ngxs-labs/select-snapshot';
import { Store } from '@ngxs/store';
import { ApiService } from '@services/api.service';
import { Features } from '@store/actions/features.actions';
import { UserState } from '@store/user.state';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'add-folder',
  templateUrl: './add-folder.component.html',
  styleUrls: ['./add-folder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddFolderComponent {

  @ViewSelectSnapshot(UserState.RetrieveUserDepartments) departments: Department[];

  constructor(
    private dialogRef: MatDialogRef<AddFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IEditFolder,
    private fb: FormBuilder,
    private _api: ApiService,
    private _snackBar: MatSnackBar,
    private _store: Store
  ) {
    console.log(JSON.parse(JSON.stringify(this.data)))
    this.rForm = this.fb.group({
      name: [this.data.mode === 'edit' ? this.data.folder.name : '', Validators.required]
    });
    if (!this.data.folder?.parent_id) {
      this.rForm.addControl('department', this.fb.control(this.data.mode === 'edit' ? this.data.folder.department : null, Validators.required))
    }
  }

  rForm: FormGroup;

  submit(values) {
    if (this.data.mode === 'new') {
      this._api.createFolder(values.name, values.department, this.data.folder.folder_id).pipe(
        switchMap(res => this._store.dispatch( new Features.GetFolders ).pipe(
          map(() => res)
        )),
      ).subscribe(res => {
        if (res.success) {
          this._snackBar.open(`Folder ${values.name} created`, 'OK');
          this.dialogRef.close(true);
        } else if (res.handled) {
          this.dialogRef.close(false);
        } else {
          this._snackBar.open('An error ocurred.', 'OK');
        }
      })
    } else {
      this._api.modifyFolder({
        folder_id: this.data.folder.folder_id,
        name: values.name,
        department: values.department
      }).pipe(
        switchMap(_ => this._store.dispatch( new Features.GetFolders ))
      ).subscribe(_ => {
        this._snackBar.open('Folder modified', 'OK')
        this.dialogRef.close(true);
      })
    }
  }

}