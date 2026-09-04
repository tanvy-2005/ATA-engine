import { apiClient } from "@/lib/apiClient";

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  project: string;
  projectId: string;
  testCasesCount: number;
  status: string;
  generatedBy: string;
  lastUpdated: string;
  created_at?: string;
}

export interface TestCase {
  id: string;
  suite_id?: string;
  title: string;
  description: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  priority: "high" | "medium" | "low";
  status: "approved" | "pending" | "rejected";
  confidence: number;
  is_manually_edited?: boolean;
}

export interface ReviewItem {
  id: string;
  title: string;
  suite: string;
  description: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  priority: "high" | "medium" | "low";
  confidence: number;
  status: "pending" | "approved" | "rejected";
  reviewer_comments?: string;
}

export interface AIGenerationHistory {
  id: string;
  date: string;
  suiteName: string;
  project: string;
  generatedCount: number;
  status: "completed" | "failed" | "in_progress";
  duration: string;
  target: string;
  model: string;
}

export const testsApi = {
  // Test Suites
  getSuites: async (projectId?: string): Promise<TestSuite[]> => {
    const res = await apiClient.get('/tests/suites', { params: { project_id: projectId } });
    return res.data;
  },

  createSuite: async (data: { name: string; description?: string; project_id?: string }): Promise<TestSuite> => {
    const res = await apiClient.post('/tests/suites', data);
    return res.data;
  },

  deleteSuite: async (suiteId: string): Promise<void> => {
    await apiClient.delete(`/tests/suites/${suiteId}`);
  },

  // Test Cases
  getSuiteCases: async (suiteId: string): Promise<TestCase[]> => {
    const res = await apiClient.get(`/tests/suites/${suiteId}/cases`);
    return res.data.map((c: any) => ({
      id: c.id,
      suite_id: c.suite_id,
      title: c.title,
      description: c.description || "",
      preconditions: c.preconditions || "",
      steps: c.steps || [],
      expectedResult: c.expected_result || c.expectedResult || "",
      priority: c.priority || "medium",
      status: c.status || "approved",
      confidence: c.confidence || 90,
      is_manually_edited: c.is_manually_edited || false
    }));
  },

  createTestCase: async (data: Partial<TestCase> & { suite_id: string }): Promise<TestCase> => {
    const res = await apiClient.post('/tests/cases', {
      suite_id: data.suite_id,
      title: data.title,
      description: data.description,
      preconditions: data.preconditions,
      steps: data.steps,
      expected_result: data.expectedResult,
      priority: data.priority,
      status: data.status,
      confidence: data.confidence
    });
    return res.data;
  },

  updateTestCase: async (caseId: string, data: Partial<TestCase>): Promise<TestCase> => {
    const payload: any = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.preconditions !== undefined) payload.preconditions = data.preconditions;
    if (data.steps !== undefined) payload.steps = data.steps;
    if (data.expectedResult !== undefined) payload.expected_result = data.expectedResult;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.status !== undefined) payload.status = data.status;
    if (data.confidence !== undefined) payload.confidence = data.confidence;

    const res = await apiClient.put(`/tests/cases/${caseId}`, payload);
    return res.data;
  },

  deleteTestCase: async (caseId: string): Promise<void> => {
    await apiClient.delete(`/tests/cases/${caseId}`);
  },

  // Review Queue
  getReviewQueue: async (statusFilter = "pending"): Promise<ReviewItem[]> => {
    const res = await apiClient.get('/tests/review-queue', { params: { status_filter: statusFilter } });
    return res.data.map((r: any) => ({
      id: r.id,
      title: r.title,
      suite: r.suite,
      description: r.description || "",
      preconditions: r.preconditions || "",
      steps: r.steps || [],
      expectedResult: r.expected_result || r.expectedResult || "",
      priority: r.priority || "medium",
      confidence: r.confidence || 85,
      status: r.status || "pending",
      reviewer_comments: r.reviewer_comments
    }));
  },

  processReviewAction: async (reviewId: string, action: string, comments?: string): Promise<void> => {
    await apiClient.post(`/tests/review-queue/${reviewId}/action`, { action, comments });
  },

  batchReviewAction: async (reviewIds: string[], action: string): Promise<void> => {
    await apiClient.post('/tests/review-queue/batch-action', { review_ids: reviewIds, action });
  },

  // AI History
  getHistory: async (): Promise<AIGenerationHistory[]> => {
    const res = await apiClient.get('/tests/history');
    return res.data.map((h: any) => ({
      id: h.id,
      date: h.date,
      suiteName: h.suite_name || h.suiteName,
      project: h.project,
      generatedCount: h.generated_count !== undefined ? h.generated_count : h.generatedCount,
      status: h.status,
      duration: h.duration,
      target: h.target,
      model: h.model
    }));
  },

  regenerateSuite: async (generationId: string, model?: string): Promise<void> => {
    await apiClient.post(`/tests/history/${generationId}/regenerate`, { model });
  },

  deleteHistory: async (generationId: string): Promise<void> => {
    await apiClient.delete(`/tests/history/${generationId}`);
  }
};
