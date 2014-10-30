#compose-datamap

Small library to match external IDs with service objects id.


##Install

`sudo apt-get install redis`

`npm i compose-datamap`

`cp node_modules/compose-datamap/config.dist.js map-config.js`

Review settings in `map-config.js` to match your settings


##Usage

```

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

##Export / Import

It is possible to migrate the mappings with `export` and `import`

###Export

```
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

```
    var map = require('./piped-export.json')
    mapper.setup(config).then(function() {
        return mapper.import(map);
    })
    .then(function() {
        mapper.db.disconnect();
        console.log('Import completed.')
    });
```
