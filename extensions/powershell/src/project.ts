/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { deconstruct, pascalCase, Dictionary } from '@microsoft.azure/codegen';
import { SchemaDefinitionResolver } from '@microsoft.azure/autorest.csharp-v2';
import { State } from './state';
import { Project as codeDomProject } from '@microsoft.azure/codegen-csharp';
import { SupportNamespace } from './namespaces/support'
import { ModelExtensionsNamespace } from './namespaces/model-extensions'
import { ModelCmdletNamespace } from './namespaces/model-cmdlet'
import { ServiceNamespace } from './namespaces/service'
import { CmdletNamespace } from './namespaces/cmdlet'

export class Project extends codeDomProject {
  public azure!: boolean;
  public cmdletFolder!: string;
  public modelCmdletFolder!: string;
  public customFolder!: string;
  public testFolder!: string;
  public runtimeFolder!: string;
  public binFolder!: string;
  public objFolder!: string;
  public exportsFolder!: string;
  public docsFolder!: string;
  public moduleName!: string;
  public csproj!: string;
  public dll!: string;
  public psd1!: string;
  public psm1!: string;
  public psm1Custom!: string;
  public apiFolder!: string;
  public apiExtensionsFolder!: string;
  public baseFolder!: string;
  public moduleFolder!: string;
  public schemaDefinitionResolver: SchemaDefinitionResolver;
  public maxInlinedParameters!: number;
  public skipModelCmdlets!: boolean;
  public projectNamespace: string;
  public overrides: Dictionary<string>;
  public get model() { return this.state.model; }

  constructor(protected state: State) {
    super();
    this.schemaDefinitionResolver = new SchemaDefinitionResolver();
    state.project = this;
    this.projectNamespace = state.model.details.csharp.namespace;

    this.overrides = {
      'Carbon.Json.Converters': `${this.projectNamespace}.Runtime.Json`,
      'Carbon.Internal.Extensions': `${this.projectNamespace}.Runtime.Json`,
      'Carbon.Internal': `${this.projectNamespace}.Runtime.Json`,
      'Carbon.Data': `${this.projectNamespace}.Runtime.Json`,
      'using Data;': '',
      'using Parser;': '',
      'using Converters;': '',
      'using Internal.Extensions;': '',

      'Carbon.Json.Parser': `${this.projectNamespace}.Runtime.Json`,
      'Carbon.Json': `${this.projectNamespace}.Runtime.Json`,
      'Microsoft.Rest.ClientRuntime': `${this.projectNamespace}.Runtime`,
      'Microsoft.Rest': `${this.projectNamespace}`,
    };
  }

  public async init(): Promise<this> {
    await super.init();
    const service = this.state.service;
    const model = this.state.model;
    const state = this.state;
    const mil = await service.GetValue('max-inlined-parameters');
    this.maxInlinedParameters = typeof mil === 'number' ? mil : 4;

    const smc = await service.GetValue('skip-model-cmdlets');
    this.azure = !!await service.GetValue('azure') || !!await service.GetValue('azure-arm') || false;
    this.skipModelCmdlets = !!smc;
    this.moduleName = await service.GetValue('module-name') || !!this.azure ? `${model.details.csharp.nounPrefix.replace(/^Az/ig, 'Az.')}` : pascalCase(deconstruct(model.details.default.name.replace(/client/ig, '')));
    this.baseFolder = await service.GetValue('base-folder') || '.';
    this.moduleFolder = await service.GetValue('module-folder') || `${this.baseFolder}/generated`;
    this.cmdletFolder = await service.GetValue('cmdlet-folder') || `${this.moduleFolder}/cmdlets`;
    this.modelCmdletFolder = await service.GetValue('model-cmdlet-folder') || `${this.moduleFolder}/model-cmdlets`;
    this.customFolder = await service.GetValue('custom-cmdlet-folder') || `${this.baseFolder}/custom`;
    this.testFolder = await service.GetValue('test-folder') || `${this.baseFolder}/test`;
    this.runtimeFolder = await service.GetValue('runtime-folder') || `${this.moduleFolder}/runtime`;
    this.apiFolder = await service.GetValue('api-folder') || `${this.moduleFolder}/api`;
    this.apiExtensionsFolder = await service.GetValue('api-extensions-folder') || `${this.moduleFolder}/api-extensions`;
    this.binFolder = await service.GetValue('bin-folder') || `${this.baseFolder}/bin`;
    this.objFolder = await service.GetValue('obj-folder') || `${this.baseFolder}/obj`;
    this.exportsFolder = await service.GetValue('exports-folder') || `${this.baseFolder}/exports`;
    this.docsFolder = await service.GetValue('docs-folder') || `${this.baseFolder}/docs`;

    this.csproj = await service.GetValue('csproj') || `${this.moduleName}.private.csproj`;
    this.dll = await service.GetValue('dll') || `${this.binFolder}/${this.moduleName}.private.dll`;
    this.psd1 = await service.GetValue('psd1') || `${this.moduleName}.psd1`;
    this.psm1 = await service.GetValue('psm1') || `${this.moduleName}.psm1`;
    this.psm1Custom = await service.GetValue('psm1-custom') || `${this.customFolder}/${this.moduleName}.custom.psm1`;

    // add project namespace
    this.addNamespace(this.serviceNamespace = new ServiceNamespace(state));
    this.addNamespace(this.supportNamespace = new SupportNamespace(this.serviceNamespace, state));
    this.addNamespace(this.modelCmdlets = new ModelCmdletNamespace(this.serviceNamespace, state));

    // add cmdlet namespace
    this.addNamespace(this.cmdlets = new CmdletNamespace(this.serviceNamespace, state));
    this.addNamespace(this.modelsExtensions = new ModelExtensionsNamespace(this.serviceNamespace, <any>state.model.schemas, state.path('components', 'schemas')));
    if (!this.skipModelCmdlets) {
      this.modelCmdlets.createModelCmdlets();
    }

    // abort now if we have any errors.
    state.checkpoint();

    return this;
  }

  public serviceNamespace!: ServiceNamespace;
  public supportNamespace!: SupportNamespace;
  public cmdlets!: CmdletNamespace;
  public modelCmdlets!: ModelCmdletNamespace;
  public modelsExtensions!: ModelExtensionsNamespace;
}
