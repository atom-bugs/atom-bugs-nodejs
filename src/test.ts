interface Person {
  name: string,
  age: number,
  active: boolean,
  dateOfBirth: Date
}

var person2: Person = {
  name: 'Lavinia Dinu',
  age: 25,
  active: true,
  dateOfBirth: new Date(1992, 2, 25)
}

var person1: Person = {
  name: 'Williams Medina',
  age: 28,
  active: true,
  dateOfBirth: new Date(1989, 0, 28)
}

function Greet (person: Person) {
  return `Hi!, my name is ${person.name}`
}

// Greet
console.log(Greet(person1))
console.log(Greet(person2))
