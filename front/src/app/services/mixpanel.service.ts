import { Injectable } from '@angular/core';
import * as mixpanel from 'mixpanel-browser';
import { COMETA_MIXPANEL_TOKEN } from '../deploy-tokens';

@Injectable()
export class MixpanelService {

  /**
   * Initialize mixpanel.
   *
   * @param {string} userToken
   * @memberof MixpanelService
   */
  init(user: Partial<UserInfo>): void {
    // Initialize Mixpanel with token
    mixpanel.init(COMETA_MIXPANEL_TOKEN);
    // Identify current session with current User ID
    mixpanel.identify(user.user_id.toString());
    // Set a name for the User ID
    mixpanel.alias(user.name, user.user_id.toString());
    // Set user information on current user
    mixpanel.people.set(user);
  }

  /**
   * Push new action to mixpanel.
   *
   * @param {string} id Name of the action to track.
   * @param {*} [action={}] Actions object with custom properties.
   * @memberof MixpanelService
   */
  track(id: string, action: any = {}): void {
    // Track a user action with extra JSON information
    mixpanel.track(id, action);
  }
}
