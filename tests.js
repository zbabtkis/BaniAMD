test('can instantiate and access with regular class', function() {
    var app = new Application({
        'class Animal': {
        }
    });
    
    ok(app.class('Animal'), "Class is accessible");
});

test('class property can be public' ,function() {
    var app = new Application({
        'class Animal': {
            'public name': 'animal'
        }
    });

    var Animal = app.use('Animal');
    var animal = new Animal();
    
    notEqual(typeof app.use('Animal'), 'undefined', 'Class property is defined');
    equal(animal.name, 'animal', 'Class property value is correct');
});

test('class property can be private' ,function() {
    var app = new Application({
        'class Animal': {
            'private name': 'animal'
        }
    });

    var Animal = app.use('Animal');
    var animal = new Animal();
    
    equal(typeof animal.name, 'undefined', 'private property not accessible out of class');
});