import { dbToy, type person } from "../db/db";
import { err, ok, type Result } from "../pkg/result";
import { CLAUSES, OPERATIONS, type Collum } from "./tokens";

export const interpret = (query: string[]): Result<string, Error> => {
    while (query.length > 0) {
        const op = getOperation(query.shift() ?? "");
        if (op === undefined) {
            return err(Error("QUERY: not valid operation"));
        }

        switch (op) {
            case OPERATIONS.SELECT:
                handleSelect(query);
                break;

            case OPERATIONS.UPDATE:
            case OPERATIONS.DELETE:
            case OPERATIONS.INSERT:
        }
    }

    return ok("QUERY: successfully executed");
};
const getOperation = (x: string): OPERATIONS => {
    return OPERATIONS[x as keyof typeof OPERATIONS];
};

const handleSelect = (query: string[]): Result<null, Error> => {
    const columns: string[] = [];
    const tables: string[] = [];
    while (query.length > 0) {
        const clause = getClauseOrCollum(query.shift() ?? "");
        if (clause === null) {
            return err(Error("CLAUSE: clause not valid"));
        }

        if (isCollum(clause)) {
            columns.push(clause.value);
            continue;
        }

        switch (clause) {
            case CLAUSES.WHERE:
                continue;
            case CLAUSES.FROM:
                const res = handleFROM(query);
                if (res.type === "err") {
                    return err(res.value);
                }
                tables.push(res.value);
                continue;
        }
    }
    const result = execSelect(columns, tables);
    if (result.type === "err") {
        return err(result.value);
    }

    return ok(null);
};

const execSelect = (columns: string[], tables: string[]): Result<null, Error> => {
    const results: any[] = [];
    while (tables.length > 0) {
        const table = dbToy.get(tables.shift() ?? "");
        if (table === undefined) {
            return err(Error("SELECT: table do not exists"));
        }

        for (const tableRow of table) {
            for (const col of columns) {
                if (col in tableRow) {
                    results.push(tableRow[col as keyof person]);
                }
            }
        }
    }

    console.log("Results: ", results);

    return ok(null);
};

const isCollum = (clause: CLAUSES | Collum): clause is Collum => {
    return (clause as Collum).value !== undefined;
};

const handleFROM = (query: string[]): Result<string, Error> => {
    const table = query.shift();
    if (table === undefined) {
        return err(Error("FROM: this clause needs a table"));
    }
    return ok(table);
};

const getClauseOrCollum = (x: string): CLAUSES | Collum | null => {
    if (x.length < 0) {
        return null;
    }
    const c = CLAUSES[x as keyof typeof CLAUSES];
    if (c === undefined) return { value: x };

    return c;
};
