
var lib = module.exports = {};

var config = lib.config = require("./config");

var Promise = require("bluebird");
var compose = require("compose.io");
var redis = require('then-redis');

config.debug = false;
config.debug = process.env.DEBUG || config.debug;

config.compose.debug = config.debug;

var d = function() { config.debug && console.log.apply(console, arguments) };

var createApi = function() {

    lib.set = function(key, val) {
        return lib.db.set(key, val);
    };

    lib.get = function(key) {
        return lib.db.get(key);
    };

    lib.del = function(key) {
        return lib.db.del(key);
    };

    lib.create = function(code, obj) {
        return lib.api.create(obj).then(function(so) {
            return lib.set(code, {
                updated: (new Date).getTime(),
                soid: so.id,
            });
        });
    };

    lib.delete = function(code) {
        return lib.get(code).then(function(val) {

            if(!val || !val.soid) {
                throw new Error("Key not found: %s", code);
            }

            return new Promise(function(ok, ko) {
                return lib.api.delete(val.soid)
                    .then(function(so) {
                        ok(so, val.updated);
                    })
                    .catch(ko);
            });
        });
    };

    lib.load = function(code) {
        return lib.get(code).then(function(val) {

            if(!val || !val.soid) {
                throw new Error("Key not found: %s", code);
            }

            return new Promise(function(ok, ko) {
                return lib.api.load(val.soid)
                    .then(function(so) {
                        ok(so, val.updated);
                    })
                    .catch(ko);
            });
        });
    };

    lib.update = function(code, serviceObject) {
        return lib.get(code).then(function(val) {

            if(typeof serviceObject === 'object') {
                throw new Error("The service object definition must be an object");
            }

            if(!serviceObject.id || serviceObject.id !== val.id) {
                throw new Error("Service object id is not set or doesn't match cached value!");
            }

            if(!val || !val.soid) {
                throw new Error("Key not found: %s", code);
            }

            return new Promise(function(ok, ko) {

                var so = new lib.api.lib.ServiceObject(serviceObject);
                return so.update()
                    .then(function() {
                        ok(this, val.updated);
                    })
                    .catch(ko);
            });
        });
    };

    return lib;
};

var redisConnection = function(api) {
    lib.api = api;
    lib.db = redis.createClient(config.redis);
    d('Created redis client');
};

lib.setup = function(_config) {
    d("Starting up..");
    config = _config || config;
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
