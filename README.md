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
    mapper.setup(require('./map-config')).then(function(map) {

        var code = 'abcd.1234';
        var serviceObject = new map.api.lib.ServiceObject({
            name: "my object"
            // ...
        });

        map.create(code, serviceObject).then(function(so) {

            console.log("Mapped %s to %s", code, so.id);

            map.load(code).then(function(so2) {
                if(so.id === so2.id) {
                    console.log("It works!");
                }
                else {
                    console.log("Something has gone wrong");
                }
            });

        });


    });

```