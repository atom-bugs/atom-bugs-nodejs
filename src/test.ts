interface Person {
  firstName: string,
  lastName: string,
  age: number,
  active: boolean,
  dateOfBirth: Date
}

var person: Person = {
  firstName: 'Williams',
  lastName: 'Medina',
  age: 28,
  active: true,
  dateOfBirth: new Date(1989, 0, 28)
}

function Greet (person: Person) {
  console.log(person, `Hi!, my name is ${person.firstName} ${person.lastName}`)
}

// Greet
Greet(person)

class MyClass {
  title: string = 'Hello World'
}

let test = new MyClass()

console.log(test)
