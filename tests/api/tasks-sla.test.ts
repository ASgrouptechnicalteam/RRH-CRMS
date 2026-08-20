/// <reference path="../../../../tsconfig.json" />
import { deriveTaskSlaStatus } from '@/services/task-sla.status'

const makeTask = (overrides: Partial<{
  status: string
  target_date: Date
  completed_at?: Date | null
}> = {}): {
  status: string
  target_date: Date
  completed_at?: Date | null
} => ({
  status: "PENDING",
  target_date: new Date(Date.now() + 86400000), // 1 day from now
  completed_at: null,
  ...overrides
})

describe("deriveTaskSlaStatus", () => {
  // 1. Pending task before deadline → ACTIVE
  it("pending task before deadline returns ACTIVE", () => {
    const task = makeTask({
      target_date: new Date(Date.now() + 86400000), // far future
    })
    const now = new Date(Date.now() - 86400000) // far past
    expect(deriveTaskSlaStatus(task, now)).toBe("ACTIVE")
  })

  // 2. Pending task exactly at deadline → ACTIVE
  //    (approved strict rule: now > target_date; at equality it is NOT breached)
  it("pending task exactly at deadline returns ACTIVE", () => {
    const now = new Date(Date.UTC(2025, 0, 15, 0, 0, 0))
    const target = new Date(Date.UTC(2025, 0, 15, 0, 0, 0))
    const task = {
      status: "PENDING",
      target_date: target,
      completed_at: null,
    } as const
    expect(deriveTaskSlaStatus(task, now)).toBe("ACTIVE")
  })

  // 3. Pending task after deadline → BREACHED
  it("pending task after deadline returns BREACHED", () => {
    const task = makeTask({
      target_date: new Date(Date.now() - 86400000), // 1 day ago
    })
    const now = new Date()
    expect(deriveTaskSlaStatus(task, now)).toBe("BREACHED")
  })

  // 4. Completed task before deadline → COMPLETED
  it("completed task before deadline returns COMPLETED", () => {
    const task = {
      status: "COMPLETED",
      target_date: new Date(Date.now() + 86400000),
      completed_at: new Date(),
    }
    const now = new Date()
    expect(deriveTaskSlaStatus(task, now)).toBe("COMPLETED")
  })

  // 5. Completed task after deadline → COMPLETED
  it("completed task after deadline returns COMPLETED", () => {
    const task = {
      status: "COMPLETED",
      target_date: new Date(Date.now() - 86400000),
      completed_at: new Date(),
    }
    const now = new Date()
    expect(deriveTaskSlaStatus(task, now)).toBe("COMPLETED")
  })

  // 6. Completed task with completed_at present → COMPLETED
  it("completed task with completed_at present returns COMPLETED", () => {
    const task = {
      status: "COMPLETED",
      target_date: new Date(Date.now() + 86400000),
      completed_at: new Date(Date.now() - 86400000),
    }
    const now = new Date()
    expect(deriveTaskSlaStatus(task, now)).toBe("COMPLETED")
  })

  // 7. Task with nullable completed_at and PENDING status → correct derived state
  it("pending task with completed_at null and past deadline returns BREACHED", () => {
    const task = makeTask({
      target_date: new Date(Date.now() - 86400000),
    })
    const now = new Date()
    // completed_at is null, status is PENDING → BREACHED per now > target_date rule
    expect(deriveTaskSlaStatus(task, now)).toBe("BREACHED")
  })

  // 8. No mutation of the Task record occurs during calculation
  it("deriveTaskSlaStatus does not mutate the input task", () => {
    const task = {
      status: "PENDING",
      target_date: new Date(Date.now() + 86400000),
      completed_at: null,
    }
    const now = new Date()
    const result = deriveTaskSlaStatus(task, now)
    // task.status should remain "PENDING"
    expect(task.status).toBe("PENDING")
    // result should be "ACTIVE"
    expect(result).toBe("ACTIVE")
  })
})