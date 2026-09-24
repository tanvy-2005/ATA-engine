import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import AuthLayout from "@/components/layout/AuthLayout";
import DashboardShell from "@/components/layout/DashboardShell";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyOtpPage from "@/pages/auth/VerifyOtpPage";
import AuthCallbackPage from "@/pages/auth/AuthCallbackPage";
import TestSuiteListPage from "@/pages/tests/TestSuiteListPage";
import TestCaseDetailPage from "@/pages/tests/TestCaseDetailPage";
import TestCaseReviewPage from "@/pages/tests/TestCaseReviewPage";
import TestGenerationHistoryPage from "@/pages/tests/TestGenerationHistoryPage";
import LandingPage from "@/pages/landing/LandingPage";
import ArchitecturePage from "@/pages/landing/ArchitecturePage";
import DocumentationPage from "@/pages/landing/DocumentationPage";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import ProjectListPage from "@/pages/projects/ProjectListPage";
import ProjectCreatePage from "@/pages/projects/ProjectCreatePage";
import ProjectOverviewPage from "@/pages/projects/ProjectOverviewPage";
import ProjectOverviewTab from "@/pages/projects/ProjectOverviewTab";
import WebsitePreviewPage from "@/pages/projects/WebsitePreviewPage";
import ProjectAgentConfigPage from "@/pages/projects/ProjectAgentConfigPage";
import ProjectSiteMapPage from "@/pages/projects/ProjectSiteMapPage";
import ProjectSettingsPage from "@/pages/projects/ProjectSettingsPage";
import RunListPage from "@/pages/runs/RunListPage";
import ReportListPage from "@/pages/reports/ReportListPage";
import ReportDetailPage from "@/pages/reports/ReportDetailPage";
import ReportSharePage from "@/pages/reports/ReportSharePage";
import AnalyticsPage from "@/pages/analytics/AnalyticsPage";
const IntegrationsListPage = lazy(() => import("@/pages/integrations/IntegrationsListPage"));
const GithubSetupPage = lazy(() => import("@/pages/integrations/GithubSetupPage"));
const GitlabSetupPage = lazy(() => import("@/pages/integrations/GitlabSetupPage"));
const JenkinsSetupPage = lazy(() => import("@/pages/integrations/JenkinsSetupPage"));
const SlackSetupPage = lazy(() => import("@/pages/integrations/SlackSetupPage"));
const MicrosoftTeamsSetupPage = lazy(() => import("@/pages/integrations/MicrosoftTeamsSetupPage"));
const JiraSetupPage = lazy(() => import("@/pages/integrations/JiraSetupPage"));
import NotFoundPage from "@/pages/NotFoundPage";
import AgentsPage from "@/pages/agents/AgentsPage";
import ProfilePage from "@/pages/settings/ProfilePage";
import CoverageTrendPage from "@/pages/analytics/CoverageTrendPage";
import FailureHeatmapPage from "@/pages/analytics/FailureHeatmapPage";
import FlakyTestsPage from "@/pages/analytics/FlakyTestsPage";
import AppBackground from "@/components/common/AppBackground";

// Workspace Management Pages
import WorkspaceListPage from "@/pages/workspace/WorkspaceListPage";
import WorkspaceCreatePage from "@/pages/workspace/WorkspaceCreatePage";
import WorkspaceDetailsPage from "@/pages/workspace/WorkspaceDetailsPage";
import WorkspaceSettingsPage from "@/pages/workspace/WorkspaceSettingsPage";
import WorkspaceMembersPage from "@/pages/workspace/WorkspaceMembersPage";
import { Toaster } from "@/components/ui/sonner";

import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/contexts/AppContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const PageLoader = () => (
  <div className="flex items-center justify-center h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ata-theme">
        <AuthProvider>
          <AppProvider>
            <BrowserRouter>
              <AppBackground />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/architecture" element={<ArchitecturePage />} />
                <Route path="/docs" element={<DocumentationPage />} />
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-otp" element={<VerifyOtpPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardShell />}>
                    <Route path="/dashboard" element={<Navigate to="/workspaces" replace />} />
                    {/* Project Routes */}
                    <Route path="projects" element={<ProjectListPage />} />
                    <Route path="projects/create" element={<ProjectCreatePage />} />
                    <Route path="projects/:projectId" element={<ProjectOverviewPage />}>
                      <Route index element={<ProjectOverviewTab />} />
                      <Route path="preview" element={<WebsitePreviewPage />} />
                      <Route path="config" element={<ProjectAgentConfigPage />} />
                      <Route path="sitemap" element={<ProjectSiteMapPage />} />
                      <Route path="settings" element={<ProjectSettingsPage />} />
                    </Route>

                    <Route path="runs" element={<RunListPage />} />
                    <Route path="reports" element={<ReportListPage />} />
                    <Route path="reports/:reportId" element={<ReportDetailPage />} />
                    <Route path="reports/share/:reportId" element={<ReportSharePage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="analytics/trends" element={<CoverageTrendPage />} />
                    <Route path="analytics/failures" element={<FailureHeatmapPage />} />
                    <Route path="analytics/flaky" element={<FlakyTestsPage />} />
                    <Route path="integrations" element={<Suspense fallback={<PageLoader />}><IntegrationsListPage /></Suspense>} />
                    <Route path="integrations/github" element={<Suspense fallback={<PageLoader />}><GithubSetupPage /></Suspense>} />
                    <Route path="integrations/gitlab" element={<Suspense fallback={<PageLoader />}><GitlabSetupPage /></Suspense>} />
                    <Route path="integrations/jenkins" element={<Suspense fallback={<PageLoader />}><JenkinsSetupPage /></Suspense>} />
                    <Route path="integrations/slack" element={<Suspense fallback={<PageLoader />}><SlackSetupPage /></Suspense>} />
                    <Route path="integrations/microsoft-teams" element={<Suspense fallback={<PageLoader />}><MicrosoftTeamsSetupPage /></Suspense>} />
                    <Route path="integrations/jira" element={<Suspense fallback={<PageLoader />}><JiraSetupPage /></Suspense>} />
                    <Route path="agents" element={<AgentsPage />} />

                    {/* Test Routes */}
                    <Route path="tests" element={<TestSuiteListPage />} />
                    <Route path="tests/suites/:suiteId" element={<TestCaseDetailPage />} />
                    <Route path="tests/review" element={<TestCaseReviewPage />} />
                    <Route path="tests/history" element={<TestGenerationHistoryPage />} />

                    <Route path="settings" element={<Navigate to="/settings/profile" replace />} />
                    <Route path="settings/profile" element={<ProfilePage />} />
                    <Route path="settings/security" element={<Navigate to="/settings/profile?tab=security" replace />} />
                    <Route path="settings/notifications" element={<Navigate to="/settings/profile?tab=notifications" replace />} />

                    {/* Workspace Routes */}
                    <Route path="workspaces" element={<WorkspaceListPage />} />
                    <Route path="workspaces/create" element={<WorkspaceCreatePage />} />
                    <Route path="workspaces/:workspaceId" element={<WorkspaceDetailsPage />} />
                    <Route path="workspaces/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
                    <Route path="workspaces/:workspaceId/members" element={<WorkspaceMembersPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
            <Toaster position="top-right" />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}


