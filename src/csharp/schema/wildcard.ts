import { fixPropertyName } from '#common/text-manipulation';
import { OneOrMoreStatements } from '#csharp/code-dom/statements/statement';
import { Serialization, Validation } from './extended-type-declaration';

export class Wildcard implements Serialization, Validation {

  constructor(protected leafType: Serialization) {
  }

  get declaration(): string {
    return `System.Collections.Generic.Dictionary<string,${this.leafType.declaration}>`;
  }
  public validatePresence(propertyName: string): string {
    return ``;
  }
  validateValue(propertyName: string): string {
    return ``;
  }
  jsonSerializationImplementation(containerName: string, propertyName: string, serializedName: string): OneOrMoreStatements {
    return `${containerName}.SafeAdd( "${serializedName}", ${this.serializeInstanceToJson(propertyName)});`.trim();
  }
  jsonDeserializationImplementationOnProperty(containerName: string, propertyName: string, serializedName: string): OneOrMoreStatements {
    return `${containerName}.DictionaryProperty("${serializedName}", ref ${propertyName}, __each => ${this.leafType.jsonDeserializationImplementationOnNode("__each")} );`
  }
  serializeInstanceToJson(instance: string): OneOrMoreStatements {
    return `Carbon.Json.JsonObject.Create( ${instance}, __each=> ${this.leafType.serializeInstanceToJson("__each")})`;
  }
  jsonDeserializationImplementationOnNode(nodeExpression: string): OneOrMoreStatements {
    return `/* FIXME: wildcard deserialize node */`;
  }
}


export class UntypedWildcard implements Serialization, Validation {

  constructor() {
  }

  get declaration(): string {
    return `System.Collections.Generic.Dictionary<string,object>`;
  }
  public validatePresence(propertyName: string): string {
    return `await listener.AssertNotNull(${fixPropertyName(propertyName)},${propertyName});`.trim();
  }
  validateValue(propertyName: string): string {
    return `/* untyped wildcard validate value for ${propertyName} */`;
  }
  jsonSerializationImplementation(containerName: string, propertyName: string, serializedName: string): OneOrMoreStatements {
    return `${containerName}.SafeAdd( "${serializedName}", ${this.serializeInstanceToJson(propertyName)});`.trim();
  }
  jsonDeserializationImplementationOnProperty(containerName: string, propertyName: string, serializedName: string): OneOrMoreStatements {
    return `/* FIXME: untyped wildcard json deserialize for ${propertyName} */`;
  }
  jsonDeserializationImplementationOnNode(nodeExpression: string): OneOrMoreStatements {
    return `/* FIXME: untyped wildcard deserialize node */`;
  }
  serializeInstanceToJson(instance: string): OneOrMoreStatements {
    return '/* FIXME: untyped wildcard serialize  */';
  }
}