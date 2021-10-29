import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { SharedModule } from './shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { MatRippleModule } from '@angular/material/core';
import { NewLandingComponent } from '@components/new-landing/new-landing.component';
import { FolderTreeComponent } from '@components/folder-tree/folder-tree.component';
import { TreeFolderItemComponent } from '../components/tree-folder-item/tree-folder-item.component';
import { NewFilterComponent } from '../components/new-filter/new-filter.component';
import { FolderListComponent } from '../components/folder-list/folder-list.component';

const routes: Routes = [
    {
        path: '',
        component: NewLandingComponent
    }
];

@NgModule({
    imports: [
        TranslateModule.forChild({
            extend: true
        }),
        RouterModule.forChild(routes),
        MatRippleModule,
        SharedModule,
        CommonModule
    ],
    declarations: [
    NewLandingComponent,
    FolderTreeComponent,
    TreeFolderItemComponent,
    NewFilterComponent,
    FolderListComponent
  ]
})
export class NewlandingModule { }