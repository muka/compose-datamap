#compose-datamap

Small library to match external IDs with service objects id.


##Install

`sudo apt-get install redis`

`npm i compose-datamap`

`cp node_modules/compose-datamap/config.dist.js map-config.js`

Review settings in `map-config.js` to match your settings

##Configuration

```javascript
var config = {

    // enable debug?
    debug: false,

    // prefix for the keys in redis, default to "compose"
    // ensure you use one to avoid that import/export impact on other data
    key_prefix: "compose",

    // a string or object compatible with then-redis
    // https://github.com/mjackson/then-redis
    redis: 'tcp://localhost:6379',

    // a string or object compatible with compose.io
    // https://github.com/compose-eu/Appcelerator/
    compose: {
        debug: false,
        apiKey: 'your api key',
        transport: 'http',
    },
};

require("compose-datamap").setup(config).then(function(mapper){

    // NOTE: All methods return a Promise

    // setter
    // serviceObject has to have an "id" property
    // mapper.set(key, serviceObject)
    // // .then(function() { ... })

    // getter
    // mapper.get(key)


    // create
    // then has so  as argument, which is a compose.io ServiceObject instance
    // mapper.create(key, serviceObject).then(function(so) {})

    // read
    // mapper.read(key).then(function(so) {})

    // update
    // mapper.update(key, serviceObject).then(function(so) {})

    // delete
    // mapper.update(key).then(function() {})

});

```


##Usage

```javascript

    var mapper = require('compose-datamap');
    mapper.setup(require('./map-config')).then(function() {

        var code = 'abcd.1234';
        var serviceObject = {
            name: "my object"
            // ...
        }

        // can be a compose.io object too
        // serviceObject = new map.ServiceObject(serviceObject);

        mapper.create(code, serviceObject).then(function(so) {

            // so is a ServiceObject instance from compose.io library
            console.log("Mapped %s to %s", code, so.id);
            console.log(so.toString());

            map.load(code).then(function(so2) {
                if(so.id === so2.id) {
                    console.log("It works!");
                    // do other cool stuff...
                    // so.getStream('myStream').subscribe(function(data) {
                    //     console.log(data);
                    // })
                }
                else {
                    console.log("Something has gone wrong ?!");
                }
            });

        });


    });

```

##Import & Export

It is possible to migrate the mappings with `export` and `import`

###Export

```javascript
    mapper.setup(config).then(function() {
        return mapper.export();
    })
    .then(function(data) {
        mapper.db.disconnect();
        return Promise.resolve(JSON.stringify(data, null, 2));
    })
    .then(console.log);
```

###Import

```javascript
    var map = require('./piped-export.json')
    mapper.setup(config).then(function() {
        return mapper.import(map);
    })
    .then(function() {
        mapper.db.disconnect();
        console.log('Import completed.')
    });
```
