import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { CustomSelectors } from '@others/custom-selectors';


@Component({
  selector: 'cometa-folder-tree',
  templateUrl: './folder-tree.component.html',
  styleUrls: ['./folder-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FolderTreeComponent implements OnInit {

  folders$: Observable<Folder[]>;

  constructor(private _store: Store) { }

  ngOnInit() {
    this.folders$ = this._store.select<Folder[]>(CustomSelectors.GetDepartmentFolders())
  }
}