import { MagicPillNotification, MagicPillType } from "./types";

const defaultPillDataNotification: MagicPillNotification = {
  icon: "checkmark",
  message: "Hey! I'm Magic Pill, your omnipotent toolbox!",
  cta: {
    icon: "arrow",
    label: "Discover what I can do",
    link: undefined, // No link by default
  },
  info: {
    title: "I'm Magic Pill, let me empower you!",
    content: `
      <p>I'll appear sometimes, depending on context, either to send you notifications 
      regarding your experience on this website or to give you indications and hints 
      at what you can do!</p>
      <p>See you around!</p>
    `,
    closeLabel: "Close",
  },
};

export const defaultPillData: MagicPillType = {
  mode: "notification",
  notification: defaultPillDataNotification,
};