/** 
 * BANI.js
 *
 * An AMD framework that uses closures to give better visibility
 * control to your app development process!
 *
 * @category  Javascript Framework
 * @author    Zachary Babtkis <zackbabtkis@gmail.com>
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @copyright 2013 Zachary Babtkis
 * @repo      https://github.com/zigzackattack/BaniAMD
 * @version   1.0.0
 *
 * ENJOY!
 */

var Bani = (function() {
    var Application = function(objects) {
        var classes = new Application.util.EventEmitter();
        
        this.appEmitter = new Application.util.EventEmitter();
                
        /**
         * Adds a class to the class registry and publishes `ready`
         * event for new class.
         *
         * @param String name name to register class under
         * @param Object cls  class structure to associate with class name
         */

        this.__addClass = function(name, cls) {
            if(classes[name]) {
                throw new Error("Class of name " + name + " already exists");
                return;
            }
            classes[name] = cls;
            classes.publish('ready:' + name);
        }
        
        /**
         * Build valid javascript class from Bani class structure
         * and create object of public methods bound to fully qualified
         * class instance.
         *
         * @param  String name name of object to create instance of.
         * @return object literal containing public and private instance objects.
         */

        this.__build = function(name, isProto) {
            var _this    = this,
                classObj = classes[name];

            var __protoConstructor = function(Class, Obj) {
                if(Class.__extender) {
                    __protoConstructor(classes[Class.__extender], Obj);
                }
                if(Class.__construct) {
                    Class.__construct.value.apply(Obj);
                }
            }

            var __buildInterface = function(Interface, Class, Obj) {
                var propVal;

                if(Class.__extender) {
                    __buildInterface(Interface, classes[Class.__extender], Obj);
                }
                for(var prop in Class) {
                    if(Class.hasOwnProperty(prop) && Class[prop].rule === 'public') {
                        propVal = Class[prop].value;

                        if(Bani.util.isFunction(propVal)) {

                            /**
                             * Bind the method (here propVal variable in closure)
                             * on object interface to object instance using the
                             * propVal in the closure as the method.
                             */
                            Interface[prop] = (function(propVal) {
                                return function() {
                                    return propVal.apply(Obj, arguments);
                                }
                            })(propVal);

                        } else {
                            Interface[prop] = propVal;
                        }
                    }
                }
            };

            var Class = function() {
                var Interface = {};

                for(var i in classObj) {
                    if(classObj[i].value) {
                        this[i] = classObj[i].value;
                    }
                }

                if(!isProto) {
                    __protoConstructor(classObj, this);
                    __buildInterface(Interface, classObj, this)
                }

                this.interface = Interface;
            }

            if(classObj.__extender) {
                var Parent = this.__build(classObj.__extender, true);
                Class.prototype = new Parent();
            }

            return Class;
        }

        /**this.__build = function(name) {
            var _this = this,
                built,
                publicObj = {},
                c = classes[name];
                    
            var privateConstructor = function() {
                for(var i in c) {
                    if(i === '__construct') {
                        continue;
                    } else {
                        this[i] = c[i].value;
                    }
                }
    
                if(c && c.__construct) {
                    c.__construct.value.apply(this);
                }
            }
    
            if(c && c.__extender) {
                built = _this.__build(c.__extender);
                privateConstructor.prototype = built.private;
                publicObj = built.public;
            }
        
            for(var i in c) {
                if(i === '__construct') continue;
                if(privateObj.hasOwnProperty(i) && c[i].rule === 'public') {
                    publicObj[i] = privateObj[i];
                }
            }
            
            return {private: privateObj, public: publicObj};
        };*/
        
        /**
         * For requesting a class
         *
         * @param  String name name of class to use in function
         * @return Pseudo constructor for new class instance.
         */
        
        this.use = function(name) {
            var _this = this;
            
            return function() {
                var Obj = _this.__build(name);
                
                return new Obj().interface;
            }
        }
        
        /** 
         * Load each app requirement if requirement doesn't exist in document
         */
        this.__loadReqs = function() {
            var reqsReady = 0,
                reqs      = 0,
                _this     = this;

            for(var name in classes) {
                var c = classes[name];
                if(c.__extender && !classes[c.__extender]) {
                    this.import(c.__extender);
                    reqs++;
                    classes.subscribe('ready:' + c.__extender, function() {
                        reqsReady++;
                        if(reqsReady === reqs) {
                            _this.appEmitter.publish('ready');
                        }
                    });
                }
            }

            if(reqs === 0) {
                _this.appEmitter.publish('ready');
            }
        }
        
        if(objects && typeof objects.main === 'function') {
            this.__main = objects.main;
        }
            
        this.augment(objects);
    }
    
    
    
    /**
     * Utility methods for building your application
     *
     */
    Application.util = {
        clone: function(obj) {
            return JSON.parse(JSON.stringify(obj));
        },
        log: function(type, message) {
            console.log(message);
        },
        is: function(type, value) {
            return Object.prototype.toString.call(value) === '[object ' + type + ']';
        },
        isArray: function(value) {
            return this.is('Array', value);
        },
        isFunction: function(value) {
            return this.is('Function', value);
        },
        isObject: function(value) {
            return this.is('Object', value);
        },
        isString: function(value) {
            return this.is('String', value);
        }
    }
    
    
    
    /** 
     * Util for creating objects with pub/sub functionality.
     */
    
    Application.util.EventEmitter = function() { 
    }
    
    Application.util.EventEmitter.prototype.Events = {};
    
    Application.util.EventEmitter.prototype.__callbacks = function(event) {
        return this.Events[event] = this.Events[event] || [];
    }
        
    Application.util.EventEmitter.prototype.subscribe = function(event, callback) {
        var Callbacks = this.__callbacks(event);
        Callbacks.push(callback);
    }
        
    Application.util.EventEmitter.prototype.publish = function(event, args) {
        var callback
          , Callbacks = this.__callbacks(event);
            
        for(var func in Callbacks) {
            callback = Callbacks[func];
            callback.call(this, args);
        }
    }
    
    
    
    /** 
     * @prototype.augment
     *
     * Add classes to application after app has been instantiated. Good
     * for AMD use.
     *
     * @param Object obj Object containing classes and namespace information.
     */
    
    Application.prototype.augment = function(obj) {
        var _app        = this
          , propertyReg = /^(public|private|protected)\s(.*?)$/i
          , classReg    = /^class\s(.*?)($|\sextends\s(.*?)$)/i
          , namespace   = "";
        
        /**
         * Build valid Bani class structure using parsing method
         * and add it to class registry.
         *
         * @param String classString name of class to register.
         * @param String namespace to register class under.
         */
        var addClass = function(classString, namespace) {
            var classMatch = classString.match(classReg)
              , classVal   = obj[classString]
              , classObj   = {}
              , className
              , propMatch;
                        
            if(classMatch && classMatch[1]) {
                className = classMatch[1];
            } else {
                className = classString;
            } 
               
            if(classMatch && classMatch[3]) {
                classObj.__extender = classMatch[3];
            }
            
            for(var propKey in classVal) {
                if(classVal.hasOwnProperty(propKey)) {
                    propMatch = propKey.match(propertyReg);
                    
                    classObj[propMatch[2]] = {
                        rule: propMatch[1],
                        value: classVal[propKey]
                    };
                }
            }
            
            className = namespace ? namespace + '.' + className : className;
            
            classObj.__class__ = {
                rule: 'private',
                value: className
            };
            
            _app.__addClass(className, classObj);
        }
        
        for(var i in obj) {
            if(i === 'namespace') {
                namespace = obj['namespace'];
                continue;
            }
            addClass(i, namespace);
        }
    };
    
    
    
    /** 
     * @prototype.run
     *
     * Start application -- waits for all dependencies to load before
     * running main function.
     */
    
    Application.prototype.run = function() {
        var _this = this;

        this.appEmitter.subscribe('ready', function() {
            if(_this.__main) {
                _this.__main();
            } else {
                Application.util.log('warn', "Application has no main function");
            }
        });

        this.__loadReqs();
    };
    
    
    
    /** 
     * @prototype.__autoload
     *
     * Helps automagically load external class scripts by naming
     * convention. Defaults to dot notation, but can be overwritten
     * by user.
     *
     * @param String path namespace followed by class name used in
     *                    .use() statements, extender names and items
     *                    in class requirements.
     *
     * @return valid path to class file
     */
    
    Application.prototype.__autoload = function(path) {
        var all = path.split('.');
        all.pop();
        path = all.join('.');
        return path.replace(/\./, '/');
    }
    
    
    
    /**
     * @prototype.import
     *
     * Import class structure via AMD.
     *
     * @param String path namespace followed by class name used in
     *                    .use() statements, extender names and items
     *                    in class requirements.
     */
    
    Application.prototype.import = function(path) {
        var path   = this.__autoload(path)
          , script = document.createElement('script')
          , head   = document.getElementsByTagName('head').item();
            
        script.src = path + '.js';
        script.async = false;
        head.appendChild(script);
    }
    
    return Application;
}) ();