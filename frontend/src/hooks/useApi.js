import { useState, useCallback } from "react";
import apiService from "../services/api";

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, ...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall(...args);
      setLoading(false);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.message || "حدث خطأ غير متوقع";
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
};

// Specific hooks for common operations
export const useFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { loading, error, execute, clearError } = useApi();

  const uploadFile = useCallback(
    async (file, analysisType) => {
      setUploadProgress(0);

      let apiCall;
      switch (analysisType) {
        case "excel":
          apiCall = apiService.analyzeExcel;
          break;
        case "excel-z":
          return execute(
            apiService.analyzeExcelZ,
            file.mainFile,
            file.imeiFile
          );
        case "compare":
          apiCall = apiService.compareSheets;
          break;
        default:
          throw new Error("نوع التحليل غير صحيح");
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await execute(apiCall, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);

      return result;
    },
    [execute]
  );

  return {
    loading,
    error,
    uploadProgress,
    uploadFile,
    clearError,
  };
};

export const useSiteSearch = () => {
  const { loading, error, execute, clearError } = useApi();

  const searchSites = useCallback(
    async (searchParams) => {
      return execute(apiService.searchSites, searchParams);
    },
    [execute]
  );

  const getStatistics = useCallback(async () => {
    return execute(apiService.getSiteStatistics);
  }, [execute]);

  return {
    loading,
    error,
    searchSites,
    getStatistics,
    clearError,
  };
};

export default useApi;