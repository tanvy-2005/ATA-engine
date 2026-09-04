import { z } from "zod";

export const environmentEnum = z.enum(["Development", "Staging", "Production"]);
export type Environment = z.infer<typeof environmentEnum>;

export const roleEnum = z.enum(["Owner", "Editor", "Viewer"]);
export type Role = z.infer<typeof roleEnum>;

export const visibilityEnum = z.enum(["Private", "Public"]);
export type Visibility = z.infer<typeof visibilityEnum>;

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project Name is required"),
  baseUrl: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
  workspaceId: z.string().min(1, "Workspace is required"),
  environment: environmentEnum,
  authRequired: z.boolean(),
  visibility: visibilityEnum,
  roleAccess: roleEnum,
  techStack: z.string().optional(),
  browser: z.string().optional(),
  tags: z.string().optional(),
  priority: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// Agent Configuration Schemas
export const autonomyLevelEnum = z.enum(["Suggest Only", "Approve Before Run", "Full Autonomous"]);
export type AutonomyLevel = z.infer<typeof autonomyLevelEnum>;

export const generalConfigSchema = z.object({
  autonomyLevel: autonomyLevelEnum,
  testTypes: z.array(z.string()).min(1, "Select at least one test type"),
});
export type GeneralConfig = z.infer<typeof generalConfigSchema>;

export const discoveryConfigSchema = z.object({
  maxCrawlDepth: z.number().min(1).max(10),
  maxPages: z.number().min(1).max(1000),
  maxComponents: z.number().min(1).max(500),
  ignoreQueryParams: z.boolean().default(true),
  followExternalLinks: z.boolean().default(false),
  enableDynamicDiscovery: z.boolean().default(true),
});
export type DiscoveryConfig = z.infer<typeof discoveryConfigSchema>;

export const authConfigSchema = z.object({
  loginUrl: z.string().url().optional().or(z.literal("")),
  username: z.string().optional(),
  password: z.string().optional(),
  otpRequired: z.boolean().default(false),
  sessionTimeout: z.number().min(1).default(30),
});
export type AuthConfig = z.infer<typeof authConfigSchema>;

// Types for components
export interface Project {
  id: string;
  _id?: string;
  name: string;
  baseUrl: string;
  description?: string;
  workspaceId?: string;
  environment?: Environment;
  status?: "Active" | "Inactive" | "Error";
  lastRun?: string;
  members?: number;
  testSuitesCount?: number;
  testCasesCount?: number;
  passRate?: number;
  techStack?: string;
  browser?: string;
  tags?: string;
  priority?: string;
  username?: string;
  password?: string;
  createdBy?: string;
  authRequired?: boolean;
  visibility?: string;
  roleAccess?: string;
  activeScopes?: Record<string, boolean>;
}
