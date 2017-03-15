sb-config-file
=========

sb-config-file is a Node.js module to help you manage your JSON configuration files without worrying about concurrency issues and double writes

## API

```js
type Options = {
  prettyPrint: boolean = true,
  atomicWrites: boolean = true,
  createIfNonExistent: boolean = false,
}

export default class ConfigFile {
  get(dotSeparatedKey: string, defaultValue = null): Promise<any>
  getSync(dotSeparatedKey: string, defaultValue = null): any
  set(dotSeparatedKey: string, value, strict = false): Promise<void>
  setSync(dotSeparatedKey: string, value, strict = false): void
  append(dotSeparatedKey: string, value, strict = false): Promise<void>
  appendSync(dotSeparatedKey: string, value, strict = false): void
  delete(dotSeparatedKey: string, strict = false): Promise<void>
  deleteSync(dotSeparatedKey: string, strict = false): void

  static get(filePath: string, defaultConfig: Object, options: Options): ConfigFile
}}
```

## Example Usage

```js
const Path = require('path')
const ConfigFile = require('sb-config-file')

ConfigFile.get(Path.join(__dirname, 'config.json')).then(function(configFile) {
  configFile.set('database.host', 'localhost')
  configFile.set('database.user', 'steelbrain')

  console.log(configFile.get('database.host')) // 'localhost'
  console.log(configFile.get('database.user')) // 'steelbrain'
  console.log(configFile.get('database'))      // { host: 'localhost', user: 'steelbrain' }

  configFile.delete('database.host')
  console.log(configFile.get('database'))      // { user: 'steelbrain' }

  configFile.set('someArray', [1, 2, 3])
  console.log(configFile.get('someArray.0')) // 1
  console.log(configFile.get('someArray.1')) // 2
  console.log(configFile.get('someArray.2')) // 3

  configFile.set('someArray.5', 50)
  console.log(configFile.get('someArray.0')) // 1
  console.log(configFile.get('someArray.1')) // 2
  console.log(configFile.get('someArray.2')) // 3
  console.log(configFile.get('someArray.3')) // null
  console.log(configFile.get('someArray.4')) // null
  console.log(configFile.get('someArray.5')) // 50

  configFile.set('newArray', [1, 2, 3])
  console.log(configFile.get('newArray')) // [1, 2, 3]
  configFile.append('newArray', 20)
  console.log(configFile.get('newArray')) // [1, 2, 3, 20]
})
```

## LICENSE

This package is licensed under the terms of MIT License. See the LICENSE file for more info.
