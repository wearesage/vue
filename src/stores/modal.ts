export type ModalType = "ConfirmationModal" | "ShareModal" | "AudioSourceModal" | "SketchModal" | "AudioFileUploadModal" | "CookieModal" | "AuthModal" | "TextInputModal" | "SubscriptionModal";

export const useModal = defineStore("modal", () => {
  const visible = ref(false);
  const transparent = ref(false);
  const message = ref<string | null>(null);
  const component = ref<ModalType | null>(null);
  const _resolve = ref<any>(null);
  const props = ref<Record<string, unknown>>({});

  function confirm(msg: string) {
    message.value = msg;
    return open("ConfirmationModal");
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  function open(modalType: ModalType, pr0ps = {}) {
    props.value = pr0ps;
    component.value = modalType;
    visible.value = true;

    window.addEventListener("keydown", onKeyDown as any);

    return new Promise((res) => {
      _resolve.value = res;
    });
  }

  function close() {
    visible.value = false;
    window.removeEventListener("keydown", onKeyDown as any);
  }

  function resolve(value: any) {
    _resolve.value?.(value);
    close();
  }

  return {
    message,
    visible,
    component,
    confirm,
    resolve,
    props,
    open,
    close,
    transparent,
  };
});
