export enum OPERATIONS {
    SELECT = "SELECT",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    INSERT = "INSERT",
    INTO = "INTO",
    VALUES = "VALUES",
}

export enum CLAUSES {
    FROM = "FROM",
    WHERE = "WHERE",
}

export enum COMPARATOR {
    NONE = "",
    EQUALS = "=",
    GREATER = ">",
    MINOR = "<",
}

export type Values = string[];

export interface Column {
    value: string;
}

export interface Table {
    value: string;
}

export interface Condition {
    right: string;
    comparisson: COMPARATOR;
    left: string;
}
