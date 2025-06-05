import { computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { getIntrospectionQuery, buildClientSchema } from "graphql";
import { gql } from "@apollo/client/core";

export function useGraphSchema() {
  const {
    result: queryResult,
    loading,
    error,
  } = useQuery(
    gql`
      ${getIntrospectionQuery()}
    `
  );
  const schema = computed(() =>
    queryResult.value ? buildClientSchema(queryResult.value) : null
  );
  return {
    loading,
    error,
    schema,
  };
}
