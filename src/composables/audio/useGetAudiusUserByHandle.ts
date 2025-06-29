import { watch, ref, type Ref, type ComputedRef } from "vue";
import { useAudius } from "../../stores/audius";

export function useGetAudiusUserByHandle(handle: Ref | ComputedRef<string>) {
  const audius = useAudius();
  const user = ref<any>(null);

  async function fetchUser() {
    user.value = await audius.fetchUser(handle.value);
  }

  watch(() => handle.value, fetchUser, { immediate: true });

  return user;
}
