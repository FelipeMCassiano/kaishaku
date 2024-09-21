import { which } from "bun";
import { dbToy, type person } from "../db/db";
import { err, ok, type Result } from "../pkg/result";
import { CLAUSES, COMPARATOR, OPERATIONS, type Collum, type Condition } from "./tokens";

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
    const conditons: Condition[] = [];
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
                const resWhere = handleWHERE(query);
                if (resWhere.type === "err") {
                    return err(resWhere.value);
                }

                conditons.push(resWhere.value);
                continue;
            case CLAUSES.FROM:
                const resFROM = handleFROM(query);
                if (resFROM.type === "err") {
                    return err(resFROM.value);
                }
                tables.push(resFROM.value);
                continue;
        }
    }
    const result = execSelect(columns, tables, conditons);
    if (result.type === "err") {
        return err(result.value);
    }

    return ok(null);
};

const execSelect = (
    columns: string[],
    tables: string[],
    conditions: Condition[],
): Result<null, Error> => {
    while (tables.length > 0) {
        const tableName = tables.shift() ?? "";
        const table = dbToy.get(tableName);

        if (!table) {
            return err(Error(`FROM: Table '${tableName}' does not exist`));
        }

        const results = table
            .map((tableRow) => {
                const rowResult: { [key: string]: any } = {};

                if (conditions.length === 0) {
                    populateRowResult(columns, tableRow, rowResult);
                    return rowResult;
                }

                for (const cond of conditions) {
                    if (evaluateCondition(cond, tableRow)) {
                        populateRowResult(columns, tableRow, rowResult);
                        break;
                    }
                }

                return Object.keys(rowResult).length > 0 ? rowResult : null;
            })
            .filter((row) => row !== null);

        console.log("Results: ", results);
    }

    return ok(null);
};

function populateRowResult(columns: string[], tableRow: any, rowResult: { [key: string]: any }) {
    columns.forEach((col) => {
        if (col in tableRow) {
            rowResult[col] = tableRow[col as keyof person];
        }
    });
}

function evaluateCondition(cond: Condition, tableRow: any): boolean {
    const leftValue = tableRow[cond.left as keyof person];

    switch (cond.comparisson) {
        case COMPARATOR.NONE:
            return true;
        case COMPARATOR.EQUALS:
            return leftValue.toString() === cond.right;
        case COMPARATOR.GREATER:
            return Number(leftValue) > Number(cond.right);
        case COMPARATOR.MINOR:
            return Number(leftValue) < Number(cond.right);
        default:
            return false;
    }
}
const isCollum = (clause: CLAUSES | Collum): clause is Collum => {
    return (clause as Collum).value !== undefined;
};

const handleWHERE = (query: string[]): Result<Condition, Error> => {
    while (query.length > 0) {
        const left = query.shift();
        const comparator = getComparator(query.shift() ?? "");
        const right = query.shift();

        if (comparator === undefined || right === undefined || left === undefined) {
            return err(Error("WHERE: invalid comparator"));
        }

        return ok({ right: right, comparisson: comparator, left: left });
    }

    return err(Error("WHERE: needs a condition"));
};

const getComparator = (x: string): COMPARATOR | undefined => {
    return Object.values(COMPARATOR).find((enumValue) => enumValue === x);
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
