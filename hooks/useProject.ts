import { useState, useEffect, useCallback } from 'react';
import { getProject, getSheets, Project, Sheet } from '../lib/storage';

interface UseProjectResult {
  project: Project | null;
  sheets: Sheet[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProject(projectId: string): UseProjectResult {
  const [project, setProject] = useState<Project | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [proj, shts] = await Promise.all([
        getProject(projectId),
        getSheets(projectId),
      ]);
      setProject(proj);
      setSheets(shts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { project, sheets, loading, error, refresh: fetch };
}
