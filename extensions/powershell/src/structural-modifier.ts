/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { codemodel, processCodeModel } from '@microsoft.azure/autorest.codemodel-v3';
import { values } from '@microsoft.azure/codegen';
import { Host } from '@microsoft.azure/autorest-extension-base';

const directivesToFilter = new Set<string>([
  'remove-command',
  'hide-command'
]);

interface RemoveCommandDirective {
  'remove-command': string;
}

interface HideCommandDirective {
  'hide-command': string;
}

let directives: Array<any> = [];

export async function structuralModifier(service: Host) {
  directives = values(await service.GetValue('directive'))
    .linq.where(directive => values(Object.keys(directive))
      .linq.where(key => directivesToFilter.has(key))
      .linq.any(each => !!each))
    .linq.toArray();
  return processCodeModel(tweakModel, service);
}

function isRemoveCommandDirective(it: any): it is RemoveCommandDirective {
  return it['remove-command'];
}

function isHideCommandDirective(it: any): it is HideCommandDirective {
  return it['hide-command'];
}

async function tweakModel(model: codemodel.Model, service: Host): Promise<codemodel.Model> {

  for (const directive of directives) {

    if (isRemoveCommandDirective(directive)) {
      const removeCommandVal = directive['remove-command'];
      const nounPrefix = model.details.default.nounPrefix;

      for (const [key, operation] of Object.entries(model.commands.operations)) {
        const isRegex = !isCommandNameLiteral(removeCommandVal);
        if (isRegex) {
          const regex = new RegExp(removeCommandVal);
          if (`${operation.details.csharp.verb}-${nounPrefix}${operation.details.csharp.noun}`.match(regex)) {
            delete model.commands.operations[key];
          }
        } else {
          if (`${operation.details.csharp.verb}-${nounPrefix}${operation.details.csharp.noun}`.toLowerCase() === removeCommandVal.toLowerCase()) {
            delete model.commands.operations[key];
          }
        }
      }

      continue;
    }

    if (isHideCommandDirective(directive)) {
      const hideCommandVal = directive['hide-command'];
      const nounPrefix = model.details.default.nounPrefix;

      for (const [key, operation] of Object.entries(model.commands.operations)) {
        const isRegex = !isCommandNameLiteral(hideCommandVal);
        if (isRegex) {
          const regex = new RegExp(hideCommandVal);
          if (`${operation.details.csharp.verb}-${nounPrefix}${operation.details.csharp.noun}`.match(regex)) {
            model.commands.operations[key].details.csharp.hideDirective = hideCommandVal;
          }
        } else {
          if (`${operation.details.csharp.verb}-${nounPrefix}${operation.details.csharp.noun}`.toLowerCase() === hideCommandVal.toLowerCase()) {
            model.commands.operations[key].details.csharp.hideDirective = hideCommandVal;;
          }
        }
      }

      continue;
    }
  }

  return model;
}

function isCommandNameLiteral(str: string): boolean {
  return /^[a-zA-Z]+-[a-zA-Z]+$/.test(str);
}