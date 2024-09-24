import { err, isErr, ok, type Result } from "../pkg/result";
import { OPERATIONS } from "./tokens";
import { handleSelect } from "./operations/select";
import { handleInsert } from "./operations/insert";
import { getOperation } from "./operations/operation";
import { handleUpdate } from "./operations/update";
import { handleDelete } from "./operations/delete";

export const interpret = (query: string[]): Result<string, Error> => {
    while (query.length > 0) {
        const op = getOperation(query.shift() ?? "");
        if (op === undefined) {
            return err(Error("QUERY: not valid operation"));
        }

        switch (op) {
            case OPERATIONS.SELECT:
                const resSELECT = handleSelect(query);
                if (isErr(resSELECT)) {
                    return err(resSELECT.value);
                }
                break;

            case OPERATIONS.UPDATE:
                const resUpdate = handleUpdate(query);
                if (isErr(resUpdate)) return err(resUpdate.value);

                break;
            case OPERATIONS.DELETE:
                const resDelete = handleDelete(query);
                if (isErr(resDelete)) return err(resDelete.value);

                break;
            case OPERATIONS.INSERT:
                const resInsert = handleInsert(query);
                if (isErr(resInsert)) {
                    return err(resInsert.value);
                }

                return ok(resInsert.value);
        }
    }

    return ok("QUERY: successfully executed");
};
