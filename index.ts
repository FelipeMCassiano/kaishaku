import { file } from "bun";
import { interpret } from "./interpreter/interpreter";
import { isErr } from "./pkg/result";

async function main() {
    const args = process.argv.slice(2);
    if (args.length > 1) {
        console.log("Usage: kaishaku [script]");
    } else if (args.length === 1) {
        await runFile(args[0]);
    }

    runPrompt();
}

function runPrompt() {
    while (true) {
        const line = prompt(">");
        if (line === null) break;

        run(line);
    }
}

function run(source: string) {
    const result = interpret(source.split(" "));
    if (isErr(result)) {
        console.error(`Error at ${result.value.message}`);
        return;
    }
}

async function runFile(path: string) {
    const content = file(path);

    const text = await content.text();

    const sanitaizedText = text.replace(/\n$/, "");
    run(sanitaizedText);
}

main();
