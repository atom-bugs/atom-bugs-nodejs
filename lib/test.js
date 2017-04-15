var person1 = {
    firstName: 'Williams',
    lastName: 'Medina',
    age: 28,
    active: true,
    dateOfBirth: new Date(1989, 0, 28)
};
var person2 = {
    firstName: 'Lavinia',
    lastName: 'Dinu',
    age: 25,
    active: true,
    dateOfBirth: new Date(1992, 2, 25)
};
function Greet(person) {
    console.log(person, "Hi!, my name is " + person.firstName + " " + person.lastName);
}
Greet(person1);
Greet(person2);
//# sourceMappingURL=test.js.map