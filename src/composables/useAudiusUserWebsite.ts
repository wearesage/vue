import { computed } from "vue";

export function useAudiusUserWebsite(user: { website: string }) {
  const website = computed(() => {
    let url = user.website;

    if (url.indexOf("http://") === -1 && url.indexOf("https://") === -1) {
      url = "https://" + url;
    } else if (url.indexOf("http://") !== -1) {
      url = url.replace("http://", "https://");
    }

    return url;
  });

  return website;
}
