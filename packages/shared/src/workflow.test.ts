import { describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "./enums";
import { STAGE_OWNER, isInProduction, nextStatus } from "./workflow";

describe("order workflow", () => {
  it("walks every status in order and stops after completion", () => {
    const visited = ["NOT_STARTED"];
    let status = nextStatus("NOT_STARTED");
    while (status) {
      visited.push(status);
      status = nextStatus(status);
    }
    expect(visited).toEqual([...ORDER_STATUSES]);
  });

  it("gives every production stage an owning department", () => {
    for (const status of ORDER_STATUSES.filter(isInProduction)) {
      expect(STAGE_OWNER[status], status).toBeDefined();
    }
  });
});
