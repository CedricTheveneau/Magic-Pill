import { defaultPillData } from '../defaultPillData';
import { CTAIcon, MagicPillNavbarItem, MagicPillType, Mode, NotificationIcon } from '../types';
import { SetStateAction, Dispatch } from 'react';

type SetPillData = Dispatch<SetStateAction<MagicPillType>>;

export const updateMode = (mode: Mode, setPillData: SetPillData) => {
  setPillData((): MagicPillType => {
    if (mode === "navbar") {
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

export const updateNotificationIcon = (icon: NotificationIcon, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        icon,
      },
    };
  });
};

export const updateNotificationMessage = (message: string, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        message,
      },
    };
  });
};

export const updateCTAIcon = (icon: CTAIcon, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: icon || defaultPillData.notification?.cta?.icon || "arrow",
        },
      },
    };
  });
};

export const updateCTALabel = (label: string, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow",
          label,
        },
      },
    };
  });
};

export const updateCTALink = (link: string, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow",
          link,
        },
        info: undefined,
      },
    };
  });
};

export const updateInfoTitle = (title: string, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow",
          link: undefined,
        },
        info: {
          ...prevData.notification?.info,
          title,
          content: prevData.notification?.info?.content || "",
          closeLabel: prevData.notification?.info?.closeLabel || ""
        },
      },
    };
  });
};

export const updateInfoContent = (content: string, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow",
          link: undefined,
        },
        info: {
          ...prevData.notification?.info,
          title: prevData.notification?.info?.title || "",
          content,
          closeLabel: prevData.notification?.info?.closeLabel || ""
        },
      },
    };
  });
};

export const updateInfoCloseLabel = (closeLabel: string, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "notification") return prevData;
    return {
      ...prevData,
      notification: {
        ...prevData.notification,
        cta: {
          ...prevData.notification?.cta,
          icon: prevData.notification?.cta?.icon || defaultPillData.notification?.cta?.icon || "arrow",
          link: undefined,
        },
        info: {
          ...prevData.notification?.info,
          title: prevData.notification?.info?.title || "",
          content: prevData.notification?.info?.content || "",
          closeLabel
        },
      },
    };
  });
};

export const updateNavItemLabel = (label: string, index: number, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "navbar") return prevData;
    const newNavItems = [...prevData.navbar.navItems];
    newNavItems[index] = { ...newNavItems[index], label };
    return {
      ...prevData,
      navbar: { ...prevData.navbar, navItems: newNavItems },
    };
  });
};

export const updateNavItemLink = (link: string, index: number, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "navbar") return prevData;
    const newNavItems = [...prevData.navbar.navItems];
    newNavItems[index] = { ...newNavItems[index], link };
    return {
      ...prevData,
      navbar: { ...prevData.navbar, navItems: newNavItems },
    };
  });
};

export const updateNavItemIcon = (icon: CTAIcon, index: number, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "navbar") return prevData;
    const newNavItems = [...prevData.navbar.navItems];
    newNavItems[index] = { ...newNavItems[index], icon };
    return {
      ...prevData,
      navbar: { ...prevData.navbar, navItems: newNavItems },
    };
  });
};

export const handleActiveNavItem = (path: string, navItems: MagicPillNavbarItem[]): string => {
  if (!navItems) return "";
  
  const sortedItems = [...navItems].sort((a, b) => 
    (b.link?.length || 0) - (a.link?.length || 0)
  );

  const matchingItem = sortedItems.find(item => 
    item.link && path.includes(item.link)
  );

  return matchingItem?.label || "";
};
export const addNavItem = (navItem: MagicPillNavbarItem, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "navbar") return prevData;
    return {
      ...prevData,
      navbar: {
        ...prevData.navbar,
        navItems: [...prevData.navbar.navItems, navItem],
      },
    };
  });
};

export const deleteNavItem = (index: number, setPillData: SetPillData) => {
  setPillData((prevData: MagicPillType) => {
    if (prevData.mode !== "navbar") return prevData;
    const newNavItems = [...prevData.navbar.navItems];
    newNavItems.splice(index, 1);
    return {
      ...prevData,
      navbar: { ...prevData.navbar, navItems: newNavItems },
    };
  });
}; 