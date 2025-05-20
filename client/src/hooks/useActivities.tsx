import { useQuery } from "@tanstack/react-query";
import { Activity } from "../types";

export const useActivities = () => {
  const {
    data: activities,
    isLoading,
    isError,
    error,
  } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  return {
    activities,
    isLoading,
    isError,
    error,
  };
};
