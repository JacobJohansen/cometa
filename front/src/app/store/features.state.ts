import { State, Action, StateContext, Selector } from '@ngxs/store';
import { ApiService } from '@services/api.service';
import { tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { produce } from 'immer';
import { ImmutableSelector } from '@ngxs-labs/immer-adapter';
import { Features } from './actions/features.actions';
import { Paginations } from './actions/paginations.actions';
import { getDescendantProp } from '@services/tools';

/**
 * @description Contains the state of:
 *   - The current features search
 *   - The details of every feature once clicked
 *   - The selected filters in search page
 *   - moreOrLessSteps property, which is specific for computeEvaluation()
 * @author Alex Barba
 */
@State<IFeaturesState>({
  name: 'features',
  defaults: {
    details: {}, // Contains an object with each feature info, with ID as key
    moreOrLessSteps: 'is',
    filters: [],
    folders: {
      features: [],
      folders: []
    },
    runs: {},
    currentRoute: [],
    applications: [],
    environments: [],
    departments: [],
    comment: 'This state saves the information of each each feature the user has access to and the filters of the search view.'
  }
})
@Injectable()
export class FeaturesState {

  constructor(
    private _api: ApiService
  ) { }

  /**
   * Fetches the folders from backend
   */
  @Action(Features.GetFolders)
  getSearch({ patchState }: StateContext<IFeaturesState>) {
    return this._api.getFolders().pipe(
      tap(folders => patchState({ folders: folders }))
    );
  }

  /**
   * Fetches the feature info for a given ID
   */
  @Action(Features.UpdateFeature)
  updateFeature({ setState }: StateContext<IFeaturesState>, { feature_id }: Features.UpdateFeature) {
    return this._api.getFeature(feature_id).pipe(
      tap(feature => {
        setState(
          produce((ctx: IFeaturesState) => {
            ctx.details[feature_id] = feature;
          })
        );
      })
    );
  }

  /**
   * Programmatically adds a new featureId to main root folder
   */
  @Action(Features.PushNewFeatureId)
  pushNewFeature({ setState }: StateContext<IFeaturesState>, { feature_id }: Features.PushNewFeatureId) {
    setState(
      produce((ctx: IFeaturesState) => {
        ctx.folders.features.push(feature_id);
      })
    );
  }

  /**
   * Updates the feature info for a given ID with optional parameters
   */
  @Action(Features.UpdateFeatureOffline)
  updateFeatureOffline({ setState }: StateContext<IFeaturesState>, { feature }: Features.UpdateFeatureOffline) {
    setState(
      produce((ctx: IFeaturesState) => {
        ctx.details[feature.feature_id] = {
          ...ctx.details[feature.feature_id],
          ...feature
        }
      })
    );
  }

  @Action(Features.PatchFeature)
  patchFeature({ setState }: StateContext<IFeaturesState>, { feature_id, info }: Features.PatchFeature) {
    // Modify feature in backend
    return this._api.patchFeature(feature_id, info).pipe(
      tap(res => {
        if (res.success) {
          // Modify feature in state
          setState(
            produce((ctx: IFeaturesState) => {
              // Check existing feature info
              if (ctx.details[feature_id]) {
                // Perform fusion of changes
                ctx.details[feature_id] = { ...ctx.details[feature_id], ...info };
              }
            })
          )
        }
      })
    )
  }

  @Action(Features.RemoveFeature)
  removeFeature({ setState }: StateContext<IFeaturesState>, { feature_id }: Features.RemoveFeature) {
    setState(
      produce((ctx: IFeaturesState) => {
        delete ctx.details[feature_id];
      })
    )
  }

  @Action(Features.SetMoreOrLessSteps)
  setMoreOrLessSteps({ patchState }: StateContext<IFeaturesState>, { moreOrLess }: Features.SetMoreOrLessSteps) {
    patchState({ moreOrLessSteps: moreOrLess });
  }

  @Action(Features.SetFilters)
  setFilters({ patchState }: StateContext<IFeaturesState>, { filters }: Features.SetFilters) {
    this.saveFilters(filters);
    // Load basic filters from localStorage on App load
    const applications = filters.filter(f => f.id === 'app').map(f => +f.value);
    const environments = filters.filter(f => f.id === 'env').map(f => +f.value);
    const departments = filters.filter(f => f.id === 'dept').map(f => +f.value);
    patchState({
      filters: filters,
      applications: applications,
      environments: environments,
      departments: departments
    });
  }

  @Action(Features.AddFilter)
  addFilter({ setState, getState }: StateContext<IFeaturesState>, { filter }: Features.AddFilter) {
    const filters = [...getState().filters, filter];
    this.saveFilters(filters);
    setState(
      produce((ctx: IFeaturesState) => {
        ctx.filters = filters;
        // Manually push basic filters to state
        switch (filter.id) {
          case 'app':
            ctx.applications.push(+filter.value);
            break;
          case 'env':
            ctx.environments.push(+filter.value);
            break;
          case 'dept':
            ctx.departments.push(+filter.value);
            break;
        }
      })
    )
  }

  @Action(Features.RemoveFilter)
  removeFilter({ setState }: StateContext<IFeaturesState>, { filter }: Features.RemoveFilter) {
    setState(
      produce((ctx: IFeaturesState) => {
        const filters = ctx.filters.filter(f => f.id !== filter.id || f.value !== filter.value);
        this.saveFilters(filters);
        ctx.filters = filters;
        switch (filter.id) {
          case 'app':
            ctx.applications = ctx.applications.filter(app => app !== filter.value);
            break;
          case 'env':
            ctx.environments = ctx.environments.filter(env => env !== filter.value);
            break;
          case 'dept':
            ctx.departments = ctx.departments.filter(dept => dept !== filter.value);
            break;
        }
      })
    )
  }

  @Action(Features.SetFeatureInfo)
  setFeatureInfo({ patchState, getState }: StateContext<IFeaturesState>, { features }: Features.SetFeatureInfo) {
    // features can be an object with 1 feature info or an array of features
    if (Array.isArray(features)) {
      // Transform the array to an object containing each info within its feature_id
      const infos = features.reduce((r, a) => {
        r[a.feature_id] = a;
        return r;
      }, {});
      patchState({
        details: {
          ...getState().details,
          ...infos
        }
      });
    } else {
      // Just push the info within its feature_id
      const { feature_id } = features;
      patchState({
        details: {
          ...getState().details,
          [feature_id]: features
        }
      });
    }
  }

  @Action(Features.SetFeatureRuns)
  setFeatureRuns({ setState }: StateContext<IFeaturesState>, { feature_id, runs }: Features.SetFeatureRuns) {
    // features can be an object with 1 feature info or an array of features
    setState(
      produce((ctx: IFeaturesState) => {
        ctx.runs[feature_id] = runs;
      })
    );
  }

  @Action(Features.ModifyFeatureInfo)
  modifyFeatureInfo({ setState }: StateContext<IFeaturesState>, { feature_id, property, value }: Features.ModifyFeatureInfo) {
    setState(
      produce((ctx: IFeaturesState) => {
        ctx.details[feature_id][property] = value;
      })
    );
  }

  @Action(Features.AddFolderRoute)
  addFolderRoute({ setState, dispatch }: StateContext<IFeaturesState>, { folder }: Features.AddFolderRoute) {
    setState(
      produce((ctx: IFeaturesState) => {
        ctx.currentRoute.push(folder);
      })
    );
    dispatch( new Paginations.ResetPagination(['search_with_depends', 'search_without_depends']) );
  }

  @Action(Features.SetFolderRoute)
  setFolderRoute({ setState, dispatch }: StateContext<IFeaturesState>, { folder }: Features.SetFolderRoute) {
    setState(
      produce((ctx: IFeaturesState) => {
        let path = folder;
        ctx.currentRoute = path || [];
        // @ts-ignore
        /* let folders: Folder = ctx.folders;
        for (const item of path) {
          const index = folders.folders.findIndex(folder => folder.folder_id === item.folder_id);
          folders = folders.folders[index];
          ctx.currentRoute.push({
            folder_id: folders.folder_id,
            name: folders.name,
            type: item.type || 'folder'
          });
        } */
        // if (ctx.currentRoute[0]) {
        //   ctx.currentRoute[0] = {folder_id: folder.folder_id, name: folder.name}
        // } else {
        //   ctx.currentRoute.push({
        //     folder_id: folder.folder_id,
        //     name: folder.name
        //   });
        // }
      })
    );
    dispatch( new Paginations.ResetPagination(['search_with_depends', 'search_without_depends']) );
  }

  @Action(Features.ReturnToFolderRoute)
  returnToFolderRoute({ patchState, getState, dispatch }: StateContext<IFeaturesState>, { folderId }: Features.ReturnToFolderRoute) {
    // Removing a folder from the folders array makes no sense,
    // therefore is preferable to return to a previous folder name and remove the subsequent folders
    let currentRoute = [ ...getState().currentRoute ];
    // Check folder id
    if (folderId) {
      const indexOfName = currentRoute.findIndex(route => route.folder_id === folderId);
      // Remove the subsequent folders
      currentRoute.splice(indexOfName + 1, currentRoute.length - indexOfName + 1);
    } else {
      // If folderId is 0 or null, it means is root folder
      currentRoute = [];
    }
    patchState({
      currentRoute: [...currentRoute]
    });
    dispatch( new Paginations.ResetPagination(['search_with_depends', 'search_without_depends']) );
  }

  @Action(Features.SetDepartmentFilter)
  setDepartment({ patchState }: StateContext<IFeaturesState>, { department_id }: Features.SetDepartmentFilter) {
    patchState({ departments: department_id });
  }

  @Action(Features.SetApplicationFilter)
  setApplication({ patchState }: StateContext<IFeaturesState>, { app_id }: Features.SetApplicationFilter) {
    patchState({ applications: app_id });
  }

  @Action(Features.SetEnvironmentFilter)
  setEnvironment({ patchState }: StateContext<IFeaturesState>, { environment_id }: Features.SetEnvironmentFilter) {
    patchState({ environments: environment_id });
  }

  @Action(Features.GetFeatures)
  getFeatures({ setState }: StateContext<IFeaturesState>) {
    return this._api.getFeatures().pipe(
      tap(features => {
        // Group by FeatureID
        const featuresGrouped = features.results.reduce((r, a) => {
          const featureId = a.feature_id;
          r[featureId] = r[featureId] || {};
          r[featureId] = a;
          return r;
        }, {})
        setState(
          produce((ctx: IFeaturesState) => {
            Object.assign(ctx.details, featuresGrouped);
          })
        )
      })
    );
  }

  @Action(Features.FolderGotRemoved)
  folderGotRemoved({ patchState, getState }: StateContext<IFeaturesState>, { folder_id }: Features.FolderGotRemoved) {
    const currentRoute = getState().currentRoute;
    const index = currentRoute.findIndex(folder => folder.folder_id === folder_id);
    if (index >= 0) {
      patchState({
        currentRoute: currentRoute.slice(0, index)
      })
    }
  }

  @Action(Features.FolderGotRenamed)
  folderGotRenamed({ setState }: StateContext<IFeaturesState>, { folder }: Features.FolderGotRenamed) {
    setState(
      produce((ctx: IFeaturesState) => {
        const index = ctx.currentRoute.findIndex(folder => folder.folder_id === folder.folder_id);
        if (index !== 0) {
          // Replace folder name
          ctx.currentRoute[index].name = folder.name;
        }
      })
    )
  }

  @Selector()
  @ImmutableSelector()
  static GetFeatures(state: IFeaturesState): IFeatureStateDetail {
    return state.details;
  }

  @Selector()
  @ImmutableSelector()
  static IsEasterEgg(state: IFeaturesState): boolean {
    // Returns true if one filter of type text equals Code is Poetry
    return state.filters.some(filter => filter.id === 'test' && filter.value.toString().toLowerCase() === 'code is poetry')
  }

  @Selector()
  @ImmutableSelector()
  static GetFeaturesAsArray(state: IFeaturesState): Feature[] {
    return Object.values(state.details);
  }

  saveFilters(filters: Filter[]) {
    localStorage.setItem('filters', JSON.stringify(filters));
  }

  @Selector()
  @ImmutableSelector()
  static GetFeatureInfo(state: IFeaturesState) {
    return (feature_id: number) => {
      return state.details[feature_id];
    };
  }

  @Selector()
  @ImmutableSelector()
  static GetFeatureRuns(state: IFeaturesState) {
    return (feature_id: number) => {
      return state.runs[feature_id] || [];
    };
  }

  @Selector()
  @ImmutableSelector()
  static GetFilters(state: IFeaturesState): Filter[] {
    return state.filters;
  }

  @Selector()
  @ImmutableSelector()
  static IsFolderInRoute(state: IFeaturesState) {
    return (folder: Folder) => {
      return state.currentRoute.some(route => route.folder_id === folder.folder_id);
    }
  }

  @Selector()
  @ImmutableSelector()
  static GetFolders(state: IFeaturesState): Folder[] {
    return state.folders.folders;
  }

  @Selector()
  @ImmutableSelector()
  static GetSelectionFolders(state: IFeaturesState) {
    return state.currentRoute;
  }

  @Selector()
  @ImmutableSelector()
  /**
   * Returns the feature IDs list for the current navigated route
   */
  static GetFeaturesWithinFolder(state: IFeaturesState): number[] {
    // Retrieve current folder
    const selectedFolders = state.currentRoute;
    let result: number[] = [];
    if (selectedFolders.length === 0) {
      // Return features of main folder
      result = state.folders.features;
    } else {
      // Return feature of the selected folders
      let folders = JSON.parse(JSON.stringify(state.folders)) as FoldersResponse;
      selectedFolders.forEach(value => {
        if (value.type === 'department') {
          // Filter features by selected department folder
          folders.features = folders.features.filter(f => state.details[f].department_id === value.folder_id);
        } else {
          // Filter feature by each selected folder in route
          const index = folders.folders.findIndex(folder => folder.folder_id === value.folder_id);
          folders = folders.folders[index];
          folders.features = folders.features;
        }
      });
      result = folders.features;
    }
    // Process resulting features with selected filters
    result = this.processFilters(state, result, state.details);
    return result;
  }

  static processFilters(state: IFeaturesState, features: number[], details: IFeatureStateDetail) {
    // Filter feature by selected environments, applications and/or departments
    const environments = state.environments;
    const applications = state.applications;
    const departments = state.departments;
    if (departments.length > 0) features = features.filter(feature => departments.includes(details[feature].department_id));
    if (applications.length > 0) features = features.filter(feature => applications.includes(details[feature].app_id));
    if (environments.length > 0) features = features.filter(feature => environments.includes(details[feature].environment_id));
    // Handle other kind of filters
    state.filters.forEach(filter => {
      switch (filter.id) {
        case 'test':
          // Filter features by name
          features = features.filter(feature => details[feature].feature_name.toLowerCase().includes(filter.value.toString().toLowerCase()));
          break;
        case 'steps':
        case 'ok':
        case 'fails':
        case 'skipped':
        case 'execution_time':
        case 'pixel_diff':
          // Filter features by given "greater, equal or smaller than" filters
          features = this.computeEvaluation(filter.id, features, details, filter.value, filter.more);
          break;
        case 'help':
          // Filter by "Asking for Help"
          features = features.filter(id => details[id]?.need_help)
      }
    });
    return features;
  }

  @Selector()
  @ImmutableSelector()
  static GetFoldersWithinFolder(state: IFeaturesState): Folder[] {
    // Same as `GetFeaturesWithinFolder` but returns folders
    const selectedFolders = state.currentRoute;
    const departments = state.filters.filter(filter => filter.id === 'dept').map(filter => filter.value);
    let folders: Folder[] = [];
    if (selectedFolders.length === 0) {
      folders = state.folders.folders;
    } else {
      // @ts-ignore
      let features = state.folders;
      selectedFolders.forEach(value => {
        const index = features.folders.findIndex(folder => folder.folder_id === value.folder_id);
        features = features.folders[index];
      });
      folders = features.folders;
    }
    if (departments.length > 0) {
      folders = folders.filter(folder => departments.includes(folder.department))
    }
    return folders;
  }

  @Selector()
  static GetLastFolder(state: IFeaturesState) {
    if (state.currentRoute.length > 0) {
      return state.currentRoute[state.currentRoute.length - 1].folder_id;
    } else {
      return 0;
    }
  }

  @Selector()
  static GetAllFolders(state: IFeaturesState) {
    return state.folders.folders;
  }

  static computeEvaluation(field: string, features: number[], details: IFeatureStateDetail, value: number | string, moreOrLessSteps: string): number[] {
    const fields = ['ok', 'fails', 'skipped', 'execution_time', 'pixel_diff'];
    if (fields.includes(field))
      field = 'info.' + field;
    switch (moreOrLessSteps) {
      case '>':
        return features.filter(feature => getDescendantProp(details[feature], field) > parseInt(value.toString(), 10));
      case 'is':
        return features.filter(feature => getDescendantProp(details[feature], field) === parseInt(value.toString(), 10));
      case '<':
        return features.filter(feature => getDescendantProp(details[feature], field) < parseInt(value.toString(), 10));
      default:
        return features;
    }
  }

}
