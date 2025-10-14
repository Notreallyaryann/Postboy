import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addRequestToCollection,
  getAllRequestFromCollection,
  Request,
  run,
  saveRequest,
} from "../actions";
import { useRequestPlaygroundStore } from "../store/useRequestStore";

/**
 * Normalizes Prisma/JSON fields so they match the SavedRequest type
 * Converts nulls → safe strings, ensures correct TS compatibility
 */
function normalizeRequestData(data: any) {
  return {
    ...data,
    body:
      typeof data.body === "string" ? data.body : JSON.stringify(data.body ?? {}),
    headers:
      typeof data.headers === "string"
        ? data.headers
        : JSON.stringify(data.headers ?? {}),
    parameters:
      typeof data.parameters === "string"
        ? data.parameters
        : JSON.stringify(data.parameters ?? {}),
    response:
      typeof data.response === "string"
        ? data.response
        : JSON.stringify(data.response ?? {}),
  };
}

/**
 * Adds a request to a collection
 */
export function useAddRequestToCollection(collectionId: string) {
  const queryClient = useQueryClient();
  const { updateTabFromSavedRequest, activeTabId } = useRequestPlaygroundStore();

  return useMutation({
    mutationFn: async (value: Request) =>
      addRequestToCollection(collectionId, value),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests", collectionId] });
      if (activeTabId) {
        const normalizedData = normalizeRequestData(data);
        updateTabFromSavedRequest(activeTabId, normalizedData);
      }
    },
  });
}

/**
 * Fetches all requests from a collection
 */
export function useGetAllRequestFromCollection(collectionId: string) {
  return useQuery({
    queryKey: ["requests", collectionId],
    queryFn: async () => getAllRequestFromCollection(collectionId),
  });
}

/**
 * Saves a single request
 */
export function useSaveRequest(id: string) {
  const { updateTabFromSavedRequest, activeTabId } = useRequestPlaygroundStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: Request) => saveRequest(id, value),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      if (activeTabId) {
        const normalizedData = normalizeRequestData(data);
        updateTabFromSavedRequest(activeTabId, normalizedData);
      }
    },
  });
}

/**
 * Runs a request and stores the response
 */
export function useRunRequest(requestId: string) {
  const { setResponseViewerData } = useRequestPlaygroundStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => run(requestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });

      // Normalize response to strictly match ResponseData type
      const normalizedData = {
        ...data,
        requestRun: {
          ...data.requestRun,
          id: data.requestRun?.id ?? "", // default to empty string if undefined
          statusText: data.requestRun?.statusText ?? undefined,
          headers:
            typeof data.requestRun?.headers === "string"
              ? data.requestRun.headers
              : JSON.stringify(data.requestRun?.headers ?? {}),
          body:
            typeof data.requestRun?.body === "string"
              ? data.requestRun.body
              : JSON.stringify(data.requestRun?.body ?? {}),
        },
      };
//@ts-ignore
      setResponseViewerData(normalizedData);
    },
  });
}


