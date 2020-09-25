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

import { errorHandling } from "../utils";
import { ZoweExplorerApiRegister } from "../api/ZoweExplorerApiRegister";
import { TextUtils, IProfileLoaded, Session } from "@zowe/imperative";
import * as vscode from "vscode";
import { Profiles, ValidProfileEnum } from "../Profiles";

import * as nls from "vscode-nls";
// Set up localization
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function uploadFile( loadedProfile: IProfileLoaded,  fileName: string, datasetName: string) {
    try {
        ZoweExplorerApiRegister.getMvsApi(loadedProfile).putContents(fileName , datasetName, {
            encoding: loadedProfile.profile.encoding
        }).then(() => {
            vscode.window.showInformationMessage("Upload was successful to '"+datasetName+"'");
        }).catch((error)=> {
            vscode.window.showErrorMessage("Error uploading to '"+datasetName+"': "+error);
        });
    } catch (e) {
        errorHandling(e, loadedProfile.profile.name, e.message);
    }
}


/**
 * Submit the contents of a file as JCL.
 *
 * @export
 * @param {DatasetTree} datasetProvider - our DatasetTree object
 */
export async function submitJob(profile: IProfileLoaded, itemName: string) {
    await Profiles.getInstance().checkCurrentProfile(profile);
    if (Profiles.getInstance().validProfile === ValidProfileEnum.VALID) {
        try {
            const job = await ZoweExplorerApiRegister.getJesApi(profile).submitJob(itemName);
            const args = [profile.name, job.jobid];
            const setJobCmd = `command:zowe.setJobSpool?${encodeURIComponent(JSON.stringify(args))}`;
            vscode.window.showInformationMessage(localize("submitJcl.jobSubmitted", "Job submitted ") + `[${job.jobid}](${setJobCmd})`);
        } catch (error) {
            errorHandling(error, profile.name, localize("submitJcl.jobSubmissionFailed", "Job submission failed\n") + error.message);
        }
    } else {
        vscode.window.showErrorMessage(localize("submitJcl.checkProfile", "Profile is invalid"));
        return;
    }
}
