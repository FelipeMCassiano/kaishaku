export enum OPERATIONS {
    SELECT = "SELECT",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    INSERT = "INSERT",
}

export enum CLAUSES {
    FROM = "FROM",
    WHERE = "WHERE",
}

export interface Collum {
    value: string;
}

export interface Table {
    value: string;
}

export interface Condition {
    right: string;
    left: string;
}
