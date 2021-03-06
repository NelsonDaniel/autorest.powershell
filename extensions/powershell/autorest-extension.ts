/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AutoRestExtension, } from '@microsoft.azure/autorest-extension-base';

import { applyModifiers } from './modifiers';
import { createCommands } from './plugin-create-commands';
import { namer } from './plugin-namer';
import { powershell } from './plugin-powershell';
import { addCompleter } from './plugin-add-azure-completers'

export async function initializePlugins(pluginHost: AutoRestExtension) {
  // add plugins
  pluginHost.Add('powershell', powershell);
  pluginHost.Add('create-commands', createCommands);
  pluginHost.Add('psnamer', namer);
  pluginHost.Add('modifiers', applyModifiers);
  pluginHost.Add('add-azure-completers', addCompleter);
}
