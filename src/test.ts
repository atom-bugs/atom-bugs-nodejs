interface Person {
  firstName: string,
  lastName: string,
  age: number,
  active: boolean,
  dateOfBirth: Date
}

var person1: Person = {
  firstName: 'Williams',
  lastName: 'Medina',
  age: 28,
  active: true,
  dateOfBirth: new Date(1989, 0, 28)
}

var person2: Person = {
  firstName: 'Lavinia',
  lastName: 'Dinu',
  age: 25,
  active: true,
  dateOfBirth: new Date(1992, 2, 25)
}

function Greet (person: Person) {
  console.log(person, `Hi!, my name is ${person.firstName} ${person.lastName}`)
}

// Greet
Greet(person1)
Greet(person2)
