import { err, isErr, ok, type Result } from "../../pkg/result";
import {
    CLAUSES,
    COMPARATOR,
    OPERATIONS,
    type Assignment,
    type Column,
    type Condition,
} from "../tokens";
import { getOperation } from "./operation";
import { evaluateCondition, handleWHERE } from "./select";
import { dbToy } from "../../db/db";
import { inferSchemaFromData, validateSchema } from "./insert";

export const handleUpdate = (query: string[]): Result<string, Error> => {
    const tableName = query.shift();
    if (tableName === undefined || isSET([tableName])) {
        return err(Error("UPDATE: table name is required"));
    }

    if (!isSET(query)) {
        return err(Error(" UPDATE: syntax error (with not set)"));
    }

    const result = getValueAndUpdate(query);
    if (isErr(result)) {
        return err(result.value);
    }

    const assigments = result.value;

    query.shift();

    const res = handleWHERE(query);
    if (isErr(res)) {
        return err(res.value);
    }
    const cond = res.value;

    execUpdate(tableName, assigments, cond);

    return ok("");
};

const execUpdate = (
    tableName: string,
    assigments: Assignment[],
    cond: Condition,
): Result<string, Error> => {
    const table = dbToy.get(tableName);
    if (table === undefined) {
        return err(Error("table does not exists"));
    }

    type typeOfTable = (typeof table)[0];

    const filteredArray = table.filter((tableRow) =>
        evaluateCondition<typeOfTable>(cond, tableRow),
    );

    const result = inferSchemaFromData(table);
    if (isErr(result)) {
        return err(result.value);
    }

    const dynamicSchema = result.value;

    filteredArray.forEach((tableRow) => {
        const rowIndex = table.indexOf(tableRow);
        if (rowIndex === -1) {
            return;
        }

        assigments.forEach((assigment) => {
            const { column, value } = assigment;

            const key = column.value as keyof typeOfTable;

            const result = validateSchema(key, dynamicSchema, tableName, column, value);
            if (isErr(result)) {
                return;
            }

            const validationResult = result.value;

            (table[rowIndex] as any)[key] = validationResult.data[key];
        });
    });

    return ok("Row successfully updated!");
};

const isSET = (query: string[]): boolean => {
    const next = query.shift();
    if (next === undefined) {
        return false;
    }
    const op = getOperation(next);
    return op === OPERATIONS.SET;
};

const getValueAndUpdate = (query: string[]): Result<Assignment[], Error> => {
    const assigments: Assignment[] = [];
    while (!isWHERE(query)) {
        const left = getColumn(query.shift());
        if (isErr(left)) {
            return err(Error(left.value));
        }
        const assigner = getAssinger(query.shift() ?? "");
        if (assigner === undefined) {
            return err(Error("UPDATE: syntax error (assigner undefined)"));
        }
        const value = query.shift() ?? "";

        assigments.push({ column: left.value, assigner: assigner, value: value });
    }

    return ok(assigments);
};

const getColumn = (x: string | undefined): Result<Column<string>, string> => {
    if (x === undefined) {
        return err("column to update must be especified");
    }
    return ok({ value: x });
};

const getAssinger = (x: string): COMPARATOR.EQUALS | undefined => {
    return x === "=" ? COMPARATOR.EQUALS : undefined;
};

const isWHERE = (query: string[]): boolean => {
    const next = query[0];
    if (next === undefined) {
        return false;
    }

    return getClause(next) === CLAUSES.WHERE;
};

const getClause = (x: string): CLAUSES | undefined => {
    return CLAUSES[x as keyof typeof CLAUSES];
};
