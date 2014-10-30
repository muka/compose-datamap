
var lib = module.exports = {};

var config = lib.config = {};

var Promise = require("bluebird");
var compose = require("compose.io");
var redis = require('then-redis');

config.debug = false;
config.debug = process.env.DEBUG || config.debug;

var key_prefix = "compose";

var d = function() { config.debug && console.log.apply(console, arguments) };

var getKey = function(key, glue) {
    glue = typeof glue === 'undefined' ? '.' : glue;
    var prefix =  config.key_prefix || key_prefix;
    return (key.substr(0, prefix.length) === prefix)  ? key : [prefix, key].join(glue);
};

var createApi = function() {

    lib.ServiceObject = lib.api.lib.ServiceObject.ServiceObject;

    lib.set = function(key, val) {
        return lib.db.set(getKey(key), JSON.stringify(val));
    };

    lib.get = function(key) {
        return lib.db.get(getKey(key)).then(function(val) {
            return Promise.resolve(JSON.parse(val));
        });
    };

    lib.del = function(key) {
        return lib.db.del(getKey(key));
    };

    lib.create = function(code, obj) {
        return lib.api.create(obj).then(function(so) {
            return lib.set(code, {
                updated: (new Date).getTime(),
                soid: so.id,
            }).then(function() {
                return Promise.resolve(so);
            });
        });
    };

    lib.delete = function(code, deleteSo) {
        deleteSo = typeof deleteSo === false || !deleteSo ? false : true
        return lib.get(code).then(function(val) {

            if(!val || !val.soid) {
                throw new Error("Key not found: %s", code);
            }

            if(!deleteSo) {
                return Promise.resolve();
            }

            return lib.api.delete(val.soid);
        });
    };

    lib.read = function(code) {
        return lib.get(code).then(function(val) {

            if(!val || !val.soid) {
                throw new Error("Key not found: " + code);
            }

            return lib.api.load(val.soid)
        });
    };

    lib.update = function(code, serviceObject) {
        return lib.get(code).then(function(val) {

            if(!serviceObject || (!serviceObject.id || serviceObject.id !== val.soid)) {
                throw new Error("Service object id is not set or doesn't match cached value!");
            }

            if(!val || !val.soid) {
                throw new Error("Key not found: %s", code);
            }

            var so = new lib.ServiceObject(serviceObject);
            return so.update().then(function() {
                return Promise.resolve(this);
            });

        });
    };

    lib.export = function() {
        var key = getKey("*", "");
        d("Exporting %s", key);
        return lib.db.keys(key).then(function(list) {

            if(!list.length) {
                return Promise.resolve([]);
            }

            var data = {};
            return Promise.all(list)
                .each(function(key) {
                    return lib.get(key).then(function(val) {
                        data[key] = val;
                    });
                })
                .then(function() {
                    return Promise.resolve(data);
                });
        });
    };

    lib.import = function(map) {

        var _keys = Object.keys(map);

        d("Importing %s items", _keys.length);

        return Promise.all(_keys).each(function(key) {
            var value = map[key];
            if(typeof value === 'string') {
                value = JSON.parse(value);
            }
            return lib.set(key, value);
        });
    };

    return Promise.resolve(lib);
};

var redisConnection = function(api) {

    lib.api = api;
    lib.db = redis.createClient(config.redis);
    d('Created redis client');

    return Promise.resolve();
};

lib.setup = function(_config) {
    d("Starting up..");
    config = _config || config;

    config.key_prefix = _config && _config.key_prefix  ? _config.key_prefix : key_prefix;

    return compose.setup(config.compose)

        .then(redisConnection)
        .then(createApi)

        .catch(function(e) {
            console.error("Error occured!");
            console.error(e);
        })

        .finally(function() {
            d("Done!");
        });
};

//var c = require("./config");
//lib.setup(c);