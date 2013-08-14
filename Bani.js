var Application = function(objects) {
	var classes = {};
    
    this.class = function(className) {
        return classes[className];
    }
    
    this.__addClass = function(name, obj) {
        if(classes[name]) {
            throw new Error("Class of name " + name + " that name already exists");
            return;
        }
        classes[name] = obj;
    }
    
    this.__fullPermissions = function(cls) {
        var jsn = {};

        for(var i in cls) {
            if(cls.hasOwnProperty(i)) {
                jsn[i] = cls[i].value;
            }
        }
        
        return jsn;
    };

    this.util = {
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
    
    this.__build = function(name) {
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

        var privateObj = new privateConstructor();

        for(var i in c) {
            if(i === '__construct') continue;
            if(privateObj.hasOwnProperty(i) && c[i].rule === 'public') {
                publicObj[i] = privateObj[i];
            }
        }
        
        return {private: privateObj, public: publicObj};
    };
    
    this.use = function(name) {
        var _this = this;
        
        if(!classes[name]) {
            this.import(name);
        }
        
        return function() {
            var obj =_this.__build(name);
            return obj.public;
        }
    }
    
    if(objects && typeof objects.main === 'function') {
        this.__main = objects.main;
    }
    
    this.augment(objects);
}

Application.log = function(type, message) {
    console.log(message);
};

Application.prototype.augment = function(obj) {
    var _app = this,
        propertyReg = /^(public|private|protected)\s(.*?)$/i,
        classReg    = /^class\s(.*?)($|\sextends\s(.*?)$)/i,
        namespace   = "";
    
	var addClass = function(classString, namespace) {
        var classMatch = classString.match(classReg),
            classVal  = obj[classString],
            classObj = {}, className, propMatch;
            
        if(classMatch && classMatch[1]) {
            className = classMatch[1];
        } else {
            className = classString;
        } 
           
        // Create new class by extending existing class.
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
        
        className = namespace + className;
        
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

Application.prototype.run = function() {
    if(this.__main) {
        this.__main();
    } else {
        Application.log('warn', "Application has no main function");
    }
};

Application.prototype.__autoload = function(path) {
    return path.replace('\\', '\/');
}

Application.prototype.import = function(path) {
    var path   = this.__autoload(path)
      , script = document.createElement('script')
      , head   = document.getElementsByTagName('head').item();
        
    script.src = path + '.js';
    head.appendChild(script);
}