import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';

import type { Workspace } from '@/types/workspace';
import type { Project } from '@/types/project';

interface AppContextType {
  workspaces: Workspace[];
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (ws: Workspace | null) => void;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  activeProject: Project | null;
  setActiveProject: (proj: Project | null) => void;
  isLoadingWorkspaces: boolean;
  isLoadingProjects: boolean;
  fetchWorkspaces: () => Promise<void>;
  fetchProjects: (workspaceId?: string) => Promise<void>;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  createProject: (payload: any) => Promise<Project>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Custom setters that also cache selection in localStorage
  const setActiveWorkspace = (ws: Workspace | null) => {
    setActiveWorkspaceState(ws);
    if (ws) {
      localStorage.setItem('active_workspace_id', ws.id || ws._id || '');
      localStorage.setItem('active_workspace_name', ws.name || '');
    } else {
      localStorage.removeItem('active_workspace_id');
      localStorage.removeItem('active_workspace_name');
    }
  };

  const setActiveProject = (proj: Project | null) => {
    setActiveProjectState(proj);
    if (proj) {
      localStorage.setItem('active_project_id', proj.id || proj._id || '');
      localStorage.setItem('active_project_name', proj.name || '');
    } else {
      localStorage.removeItem('active_project_id');
      localStorage.removeItem('active_project_name');
    }
  };

  // Fetch workspaces from backend
  const fetchWorkspaces = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setIsLoadingWorkspaces(false);
      return;
    }
    
    setIsLoadingWorkspaces(true);
    try {
      const response = await apiClient.get(`/workspaces?t=${Date.now()}`);
      if (Array.isArray(response.data)) {
        const wsList = response.data.map((w: any) => ({
          ...w,
          id: w.id || w._id,
          environments: (w.environments && w.environments.length > 0) ? w.environments : [
            { id: "env-1", name: "Development", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
            { id: "env-2", name: "Staging", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
            { id: "env-3", name: "Production", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() }
          ]
        }));
        setWorkspaces(wsList);

        // Restore last selected workspace
        const storedWsId = localStorage.getItem('active_workspace_id');
        const matched = wsList.find((w: any) => w.id === storedWsId || w._id === storedWsId);
        if (matched) {
          setActiveWorkspace(matched);
        } else if (wsList.length > 0) {
          setActiveWorkspace(wsList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  // Fetch all projects across all workspaces
  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await apiClient.get(`/projects?t=${Date.now()}`);
      const data = response.data;
      if (Array.isArray(data)) {
        const projList = data.map((p: any) => ({
          ...p,
          id: p.id || p._id
        }));
        setProjects(projList);

        // Restore last selected project
        const storedProjId = localStorage.getItem('active_project_id');
        const matched = projList.find((p: any) => p.id === storedProjId || p._id === storedProjId);
        if (matched) {
          setActiveProject(matched);
        } else if (projList.length > 0) {
          setActiveProject(projList[0]);
        } else {
          setActiveProject(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Create Workspace
  const createWorkspace = async (name: string, description = '') => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const res = await apiClient.post('/workspaces', {
      name,
      slug,
      description,
      settings: {}
    });
    const newWs = {
      ...res.data,
      id: res.data.id || res.data._id,
      environments: [
        { id: "env-1", name: "Development", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
        { id: "env-2", name: "Staging", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() },
        { id: "env-3", name: "Production", apiUrl: "", isEnabled: true, createdAt: new Date().toISOString() }
      ]
    };
    setWorkspaces(prev => [newWs, ...prev]);
    setActiveWorkspace(newWs);
    return newWs;
  };

  // Create Project
  const createProject = async (payload: any) => {
    const wsId = payload.workspaceId || activeWorkspace?.id || activeWorkspace?._id || localStorage.getItem('active_workspace_id');
    if (!wsId) {
      throw new Error("No active workspace selected. Please select or create a workspace first.");
    }
    const body = {
      ...payload,
      workspaceId: wsId
    };
    const res = await apiClient.post('/projects', body);
    const newProj = {
      ...res.data,
      id: res.data.id || res.data._id
    };

    // Immediately update local store (instant update)
    setProjects(prev => [newProj, ...prev]);
    setActiveProject(newProj);
    
    // Mark as created by this user
    try {
      const createdProjects = JSON.parse(localStorage.getItem('created_projects') || '[]');
      if (!createdProjects.includes(newProj.id)) {
        createdProjects.push(newProj.id);
        localStorage.setItem('created_projects', JSON.stringify(createdProjects));
      }
    } catch (e) {
      console.error('Failed to update created_projects in localStorage', e);
    }
    
    return newProj;
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    }
  }, [isAuthenticated]);

  // Sync projects list when workspace changes
  useEffect(() => {
    if (isAuthenticated && activeWorkspace) {
      fetchProjects();
    } else {
      setProjects([]);
      setActiveProject(null);
    }
  }, [activeWorkspace, isAuthenticated]);

  return (
    <AppContext.Provider
      value={{
        workspaces,
        setWorkspaces,
        activeWorkspace,
        setActiveWorkspace,
        projects,
        setProjects,
        activeProject,
        setActiveProject,
        isLoadingWorkspaces,
        isLoadingProjects,
        fetchWorkspaces,
        fetchProjects,
        createWorkspace,
        createProject
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
