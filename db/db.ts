// TODO: a b-tree later
//
import { type User } from "./type";

export const dbToy: Map<string, User[]> = new Map();
const users: User[] = [
    { name: "pedro", age: 25 },
    { name: "joaquin", age: 50 },
];

dbToy.set("users", users);
