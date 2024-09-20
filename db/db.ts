// DO a b-tree later

export const dbToy: Map<string, person[]> = new Map();

dbToy.set("pessoas", [
    { name: "pedro", age: 25 },
    { name: "joaquin", age: 50 },
]);

export interface person {
    name: string;
    age: number;
}
