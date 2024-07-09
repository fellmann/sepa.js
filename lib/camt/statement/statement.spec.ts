import { readFileSync } from 'fs';
import { describe, expect, test } from "@jest/globals";
import { CustomerStatementDocument } from "./CustomerStatementDocument";

describe("bank statement schema validation tests", () => {
  test("imports bank statement", () => {
    const xml = readFileSync("schema/camt.053.001.08.xml").toString();
    const document = new CustomerStatementDocument(xml).parse();

    // TODO: Add more tests
    expect(!!document).toBe(true);
  });
});
