import { computed, type Ref } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { gql } from "@apollo/client/core";

export function useRawQuery(val: Ref<string>) {
  const query = computed(
    () =>
      gql`
        ${val.value}
      `
  );
  
  const { result, loading, error } = useQuery(query);

  return {
    result,
    loading,
    error,
  };
}
