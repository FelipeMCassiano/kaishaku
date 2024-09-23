import type { ZodType } from "zod";

const typeConverters: Record<string, (value: any) => any> = {
    ZodString: (value) => String(value),
    ZodNumber: (value) => parseFloat(value),
    ZodBoolean: (value) => value === "true",
    ZodDate: (value) => new Date(value),
    ZodArray: (value) => JSON.parse(value),
    ZodObject: (value) => JSON.parse(value),
};

export const convertType = <T>(value: any, typeObj: ZodType<T>): any => {
    const converter = typeConverters[typeObj as any];

    return converter(value);
};
