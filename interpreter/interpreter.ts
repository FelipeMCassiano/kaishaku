import { err, ok, type Result } from "../pkg/result";
import { OPERATIONS } from "./tokens";
import { handleSelect } from "./operations/select";
import { handleInsert } from "./operations/insert";
import { getOperation } from "./operations/operation";

export const interpret = (query: string[]): Result<string, Error> => {
  while (query.length > 0) {
    const op = getOperation(query.shift() ?? "");
    if (op === undefined) {
      return err(Error("QUERY: not valid operation"));
    }

    switch (op) {
      case OPERATIONS.SELECT:
        const resSELECT = handleSelect(query);
        if (resSELECT.type === "err") {
          return err(resSELECT.value);
        }
        break;

      case OPERATIONS.UPDATE:
      case OPERATIONS.DELETE:
      case OPERATIONS.INSERT:
        const resInsert = handleInsert(query);
        if (resInsert.type === "err") {
          return err(resInsert.value);
        }

        return ok(resInsert.value);
    }
  }

  return ok("QUERY: successfully executed");
};
