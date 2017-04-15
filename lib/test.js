var person2 = {
    name: 'Lavinia Dinu',
    age: 25,
    active: true,
    dateOfBirth: new Date(1992, 2, 25)
};
var person1 = {
    name: 'Williams Medina',
    age: 28,
    active: true,
    dateOfBirth: new Date(1989, 0, 28)
};
function Greet(person) {
    return "Hi!, my name is " + person.name;
}
console.log(Greet(person1));
console.log(Greet(person2));
//# sourceMappingURL=test.js.map