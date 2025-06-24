import { defaultPillData } from '../defaultPillData';
import { CTAIcon, MagicPillType, Mode, NotificationIcon } from '../types/index';
import { SetStateAction, Dispatch } from 'react';

type SetPillData = Dispatch<SetStateAction<MagicPillType>>;

export const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const selectedMode = event.target.value as unknown as Mode;
  setPillData((): MagicPillType => {
    if (selectedMode === "navbar") {
      return {
        mode: "navbar",
        navbar: { navItems: [] }
      };
    }
    return {
      mode: "notification",
      notification: {
        icon: "",
        message: "",
      }
    };
  });
};

export const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const selectedIcon = event.target.value as unknown as NotificationIcon;
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        icon: selectedIcon,
      },
    };
  });
};

export const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const selectedMessage = event.target.value;
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        message: selectedMessage,
      },
    };
  });
};

export const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const customMessage = event.target.value;
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        message: customMessage,
      },
    };
  });
};

export const handleCTAIconChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const selectedIcon = event.target.value as unknown as CTAIcon;
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: selectedIcon || defaultPillData.notification?.cta?.icon || "arrow", // Ensure icon is always present
        },
      },
    };
  });
};

export const handleCTAMessageChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const selectedMessage = event.target.value;
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow", // Ensure icon is always present
          label: selectedMessage,
        },
      },
    };
  });
};

export const handleCTATextChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const customMessage = event.target.value;
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow", // Ensure icon is always present
          label: customMessage,
        },
      },
    };
  });
};

export const handleCTALinkChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const selectedLink = event.target.value;
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow", // Ensure icon is always present
          link: selectedLink,
        },
        info: undefined,
      },
    };
  });
};

export const handleCTACustomLinkChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const customLink = event.target.value;
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow", // Ensure icon is always present
          link: customLink,
        },
        info: undefined,
      },
    };
  });
};

export const handleInfoTitleChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const selectedTitle = event.target.value;
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow", // Ensure icon is always present
          link: undefined,
        },
        info: {
          ...prevData.notification?.info,
          title: selectedTitle,
          content: prevData.notification?.info?.content || "",
          closeLabel: prevData.notification?.info?.closeLabel || ""
        },
      },
    };
  });
};

export const handleInfoCustomTitleChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const customTitle = event.target.value;
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow", // Ensure icon is always present
          link: undefined,
        },
        info: {
          ...prevData.notification?.info,
          title: customTitle,
          content: prevData.notification?.info?.content || "",
          closeLabel: prevData.notification?.info?.closeLabel || ""
        },
      },
    };
  });
};

export const handleInfoCustomContentChange = (event: React.ChangeEvent<HTMLInputElement>, setPillData: SetPillData) => {
  const customContent = event.target.value;
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow", // Ensure icon is always present
          link: undefined,
        },
        info: {
          ...prevData.notification?.info,
          title: prevData.notification?.info?.title || defaultPillData.notification?.info?.title || "",
          content: customContent,
          closeLabel: prevData.notification?.info?.closeLabel || ""
        },
      },
    };
  });
};

export const handleNavItemLabelChange = (event: React.ChangeEvent<HTMLInputElement>, index: number, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "navbar") return prevData;
    const newNavItems = [...prevData.navbar.navItems];
    newNavItems[index] = {
      ...newNavItems[index] || { icon: "arrow", link: "" },
      label: event.target.value
    };
    return {
      ...prevData,
      navbar: {
        ...prevData.navbar,
        navItems: newNavItems
      }
    };
  });
};

export const handleNavItemLinkChange = (event: React.ChangeEvent<HTMLInputElement>, index: number, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "navbar") return prevData;
    const newNavItems = [...prevData.navbar.navItems];
    newNavItems[index] = {
      ...newNavItems[index] || { icon: "arrow", label: "" },
      link: event.target.value
    };
    return {
      ...prevData,
      navbar: {
        ...prevData.navbar,
        navItems: newNavItems
      }
    };
  });
};

export const handleNavItemIconChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, index: number, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "navbar") return prevData;
    const newNavItems = [...prevData.navbar.navItems];
    newNavItems[index] = {
      ...newNavItems[index] || { label: "", link: "" },
      icon: event.target.value as CTAIcon
    };
    return {
      ...prevData,
      navbar: {
        ...prevData.navbar,
        navItems: newNavItems
      }
    };
  });
};

export const handleAddNavItem = (setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "navbar") return prevData;
    return {
      ...prevData,
      navbar: {
        ...prevData.navbar,
        navItems: [...prevData.navbar.navItems, { label: "", link: "", icon: "arrow" }]
      }
    };
  });
};

export const handleDeleteNavItem = (index: number, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "navbar") return prevData;
    const newNavItems = prevData.navbar.navItems.filter((_, i) => i !== index);
    return {
      ...prevData,
      navbar: {
        ...prevData.navbar,
        navItems: newNavItems
      }
    };
  });
}; 