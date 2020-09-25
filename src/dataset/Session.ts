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

import { IProfileLoaded, Logger, Session } from "@zowe/imperative";
import { Profiles, ValidProfileEnum } from "../Profiles";
import { ZoweExplorerApiRegister } from "../api/ZoweExplorerApiRegister";
import { IZoweSessionManager } from "../api/IZoweSessionManager";

/**
 * Creates a session manager
 *
 * @export
 */
export async function createSessionManager() {
    const sessionManager = new SessionManager();
    sessionManager.addSession();
    return sessionManager;
}

export class SessionManager implements IZoweSessionManager {
    private mSessions: Map<string, Session>;
    private mProfiles: Map<string, IProfileLoaded>;

    constructor() {
        this.mSessions = new Map<string, Session>();
        this.mProfiles = new Map<string, IProfileLoaded>();
    }

    public getProfile(profileName: string) {
        return this.mProfiles.get(profileName);
    }

    public getProfiles(): Map<string, IProfileLoaded> {
        return this.mProfiles;
    }

    public loadProfiles(profileType?: string) {
        const profiles: IProfileLoaded[] = Profiles.getInstance().allProfiles;
        for (const zosmfProfile of profiles) {
            if ( !this.mProfiles.has(zosmfProfile.name) ){
                this.mProfiles.set(zosmfProfile.name, zosmfProfile);
            }
        }
        if (this.mSessions.size === 1) {
            const defaultProfile = Profiles.getInstance().getDefaultProfile(profileType);
            if ( !this.mProfiles.has(defaultProfile.name) ){
                this.mProfiles.set(defaultProfile.name, defaultProfile);
            }
        }
    }

    /**
     * Adds a new session
     *
     * @param {string} [sessionName] - optional; loads default profile if not passed
     */
    public async addSession(sessionName?: string, profileType?: string) {
        // Loads profile associated with passed sessionName, default if none passed
        if (sessionName) {
            const zosmfProfile: IProfileLoaded = Profiles.getInstance().loadNamedProfile(sessionName);
            if (zosmfProfile) {
                this.addSingleSession(zosmfProfile);
            }
        } else {
            const profiles: IProfileLoaded[] = Profiles.getInstance().allProfiles;
            for (const zosmfProfile of profiles) {
                if ( !this.mProfiles.has(zosmfProfile.name) ){
                    this.mProfiles.set(zosmfProfile.name, zosmfProfile);
                }
                this.addSingleSession(zosmfProfile);
            }
            if (this.mSessions.size === 1) {
                const defaultProfile = Profiles.getInstance().getDefaultProfile(profileType);
                if ( !this.mProfiles.has(defaultProfile.name) ){
                    this.mProfiles.set(defaultProfile.name, defaultProfile);
                }
                this.addSingleSession(defaultProfile);
            }
        }
    }

    /**
     * Removes a session from the list
     *
     * @param node
     */
    public deleteSession(sessionName: string) {
        this.mSessions.delete(sessionName);
    }

    /**
     * Adds a single session to the data set tree
     *
     */
    private addSingleSession(profile: IProfileLoaded) {
        if (profile) {
            // If session is already added, do nothing
            if (this.mSessions.has(profile.name)) {
                return;
            }
            // Uses loaded profile to create a session with the MVS API
            const session = ZoweExplorerApiRegister.getMvsApi(profile).getSession();
            this.mSessions.set( profile.name, session );
        }
    }
}

