import { ref } from "vue";

export function useTabs($tabs: string[]) {
  const tabs = ref($tabs);
  const activeTab = ref($tabs?.[0]);

  function selectTab(val: string) {
    if (tabs.value.indexOf(val) === -1) {
      console.warn(`Invalid tab selection: \`${val}\``);
      return;
    }

    activeTab.value = val;
  }

  return {
    tabs,
    activeTab,
    selectTab,
  };
}
