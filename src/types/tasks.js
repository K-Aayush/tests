const { z } = require("zod");

// Enums
const TaskStatus = z.enum([
  "draft",
  "requested",
  "received",
  "accepted",
  "rejected",
  "ready",
  "cancelled",
  "in_progress",
  "on_hold",
  "failed",
  "completed",
  "entered_in_error",
]);

const TaskIntent = z.enum([
  "unknown",
  "proposal",
  "plan",
  "order",
  "original_order",
  "reflex_order",
  "filler_order",
  "instance_order",
  "option",
]);

const TaskPriority = z.enum(["routine", "urgent", "asap", "stat"]);

// Create task schema
const createTaskSchema = z
  .object({
    externalId: z.string().optional(),
    status: TaskStatus.default("draft"),
    intent: TaskIntent.default("unknown"),
    priority: TaskPriority.default("routine").optional(),
    code: z.string().min(1, "Task code is required"),
    description: z.string().optional(),
    focusId: z.string().optional(),
    focusType: z.string().optional(),
    requesterId: z.string().optional(),
    ownerId: z.string().optional(),
    executionPeriodStart: z.string().datetime().optional(),
    executionPeriodEnd: z.string().datetime().optional(),
    authoredOn: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.executionPeriodStart && data.executionPeriodEnd) {
        const startTime = new Date(data.executionPeriodStart);
        const endTime = new Date(data.executionPeriodEnd);
        return endTime > startTime;
      }
      return true;
    },
    {
      message: "Execution period end must be after start",
      path: ["executionPeriodEnd"],
    }
  );

// Update task schema
const updateTaskSchema = createTaskSchema.partial().refine(
  (data) => {
    if (data.executionPeriodStart && data.executionPeriodEnd) {
      const startTime = new Date(data.executionPeriodStart);
      const endTime = new Date(data.executionPeriodEnd);
      return endTime > startTime;
    }
    return true;
  },
  {
    message: "Execution period end must be after start",
    path: ["executionPeriodEnd"],
  }
);

// Task response schema
const taskResponseSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  status: TaskStatus,
  intent: TaskIntent,
  priority: TaskPriority.optional(),
  code: z.string(),
  description: z.string().optional(),
  focusId: z.string().optional(),
  focusType: z.string().optional(),
  requesterId: z.string().optional(),
  ownerId: z.string().optional(),
  executionPeriodStart: z.string().optional(),
  executionPeriodEnd: z.string().optional(),
  authoredOn: z.string(),
  lastModified: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  requester: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      specialty: z.string().optional(),
    })
    .optional(),
  owner: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      specialty: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskResponseSchema,
  TaskStatus,
  TaskIntent,
  TaskPriority,
};
