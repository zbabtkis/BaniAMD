application.augment({
    namespace: 'Module\module',
    'class Person': {
        'public says': function() {
            alert("Hello, my name is: " + this.name);
        },
        'private name': 'Zack'
    }
});