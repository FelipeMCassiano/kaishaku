import { dbToy } from "../../db/db";
import { err, isErr, ok, type Result } from "../../pkg/result";
import type { Condition } from "../tokens";
import { evaluateCondition, handleFROM, handleWHERE } from "./select";

export const handleDelete = (query: string[]): Result<string, Error> => {
    query.shift();
    const result = handleFROM(query);
    if (isErr(result)) return err(result.value);

    const table = result.value;

    query.shift();
    const res = handleWHERE(query);
    if (isErr(res)) return err(res.value);

    const cond = res.value;

    execDelete(table, cond);

    return ok("");
};

const execDelete = (tableName: string, cond: Condition): Result<string, Error> => {
    const table = dbToy.get(tableName);
    if (table === undefined) return err(Error(`INSERT: table (${tableName}) does not exists`));

    type typeOfTable = (typeof table)[0];

    const filteredTable = table.filter(
        (tableRow) => !evaluateCondition<typeOfTable>(cond, tableRow),
    );

    dbToy.set(tableName, filteredTable);

    return ok("Row successfully deleted");
};
