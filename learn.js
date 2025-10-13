let personsWithId = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
]
const per = {name: 'Robert', age: 20}
personsWithId = personsWithId.map(p => p.id === 2 ? {...p, ...per} : p)

console.log(personsWithId.find(p => p.id === 2)) // { id: 2, name: "Bob" }

let e = 'a'
console.log(e? true : false) // false;

console.log(process.env.OPENAI_API_KEY) 


