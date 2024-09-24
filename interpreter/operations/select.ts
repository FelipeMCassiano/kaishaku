import { dbToy } from "../../db/db";
import { err, isErr, ok, type Result } from "../../pkg/result";
import { CLAUSES, COMPARATOR, type Column, type Condition } from "./../tokens";

export const handleSelect = (query: string[]): Result<null, Error> => {
    const columns: string[] = [];
    const tables: string[] = [];
    const conditons: Condition[] = [];
    while (query.length > 0) {
        const clause = getClauseOrCollum(query.shift() ?? "");
        if (clause === null) {
            return err(Error("CLAUSE: clause not valid"));
        }

        if (isColumn(clause)) {
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
    if (isErr(result)) {
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

        type typeOfTable = (typeof table)[0];

        const results = table
            .map((tableRow) => {
                const rowResult: { [key: string]: any } = {};

                if (conditions.length === 0) {
                    populateRowResult<typeOfTable>(columns, tableRow, rowResult);
                    return rowResult;
                }

                for (const cond of conditions) {
                    if (evaluateCondition<typeOfTable>(cond, tableRow)) {
                        populateRowResult<typeOfTable>(columns, tableRow, rowResult);
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

function populateRowResult<T>(columns: string[], tableRow: any, rowResult: { [key: string]: any }) {
    columns.forEach((col) => {
        if (col in tableRow) {
            rowResult[col] = tableRow[col as keyof T];
        }
    });
}

export function evaluateCondition<T>(cond: Condition, tableRow: any): boolean {
    const leftValue = tableRow[cond.left as keyof T];

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
const isColumn = (clause: CLAUSES | Column<string>): clause is Column<string> => {
    return (clause as Column<string>).value !== undefined;
};

export const handleWHERE = (query: string[]): Result<Condition, Error> => {
    const left = query.shift();
    const comparator = getComparator(query.shift() ?? "");
    const right = query.shift();

    if (comparator === undefined || right === undefined || left === undefined) {
        return err(Error("WHERE: invalid comparator"));
    }

    return ok({ right: right, comparisson: comparator, left: left });
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

const getClauseOrCollum = (x: string): CLAUSES | Column<string> | null => {
    if (x.length < 0) {
        return null;
    }
    const c = CLAUSES[x as keyof typeof CLAUSES];
    if (c === undefined) return { value: x };

    return c;
};
