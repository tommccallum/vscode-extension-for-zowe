/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/


import * as zowe from "@zowe/cli";
import { IProfileLoaded, Session } from "@zowe/imperative";

export interface IZoweSessionManager {

    getProfile(profileName: string): IProfileLoaded;
    getProfiles(): Map<string, IProfileLoaded>;

    /**
     * Load all profile types
     * @param profileType Type of profile to load e.g. zosmf
     */
    loadProfiles(profileType?: string): void;

    /**
     * Adds a new session
     *
     * @param {string} [sessionName] - optional; loads default profile if not passed
     */
    addSession(sessionName?: string, profileType?: string): void;

    /**
     * Removes a session from the list
     *
     * @param node
     */
    deleteSession(sessionName: string): void;
}
