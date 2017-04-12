var person = {
    firstName: 'Williams',
    lastName: 'Medina',
    age: 28,
    active: true,
    dateOfBirth: new Date(1989, 0, 28)
};
function Greet(person) {
    console.log(person, "Hi!, my name is " + person.firstName + " " + person.lastName);
}
Greet(person);
var MyClass = (function () {
    function MyClass() {
        this.title = 'Hello World';
    }
    return MyClass;
}());
var test = new MyClass();
console.log(test);
//# sourceMappingURL=test.js.map