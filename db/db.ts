// TODO: a b-tree later
//
import { type Person, type User } from "./type";

const createDb = <V>(): Map<string, V[]> => {
    return new Map<string, V[]>();
};
export const dbToy = createDb();

const users: User[] = [
    { name: "pedro", age: 25 },
    { name: "joaquin", age: 50 },
];

const people: Person[] = [
    { name: "jurandir", height: 1.5 },
    { name: "enzo", height: 0.5 },
];

dbToy.set("users", users);
dbToy.set("people", people);
