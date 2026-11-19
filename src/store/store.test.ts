import { beforeEach, describe, expect, it, vi } from "vitest";

import { getStore, pill, resetStores } from "./store";

describe("pill() and the store", () => {
  beforeEach(() => {
    resetStores();
  });

  it("queues notifications first in, first out, and returns their ids", () => {
    // Act
    const first = pill().notify({ message: "first" });
    const second = pill().notify({ message: "second" });

    // Assert
    const { current, queued } = getStore("main").getState();
    expect(first).not.toBe(second);
    expect(current?.id).toBe(first);
    expect(queued.map((item) => item.id)).toEqual([second]);
  });

  it("keeps one queue per name", () => {
    // Act
    pill("sidebar").notify({ message: "side" });

    // Assert
    expect(getStore("main").getState().current).toBeNull();
    expect(getStore("sidebar").getState().current?.input).toMatchObject({ message: "side" });
    expect(pill("sidebar")).toBe(pill("sidebar"));
    expect(pill().name).toBe("main");
  });

  it("updates in place when notify() reuses an id", () => {
    // Arrange
    pill().notify({ id: "save", message: "Saving…" });
    pill().notify({ message: "later" });

    // Act
    const id = pill().notify({ id: "save", message: "Saved" });

    // Assert
    const { current, queued } = getStore("main").getState();
    expect(id).toBe("save");
    expect(current?.input).toMatchObject({ message: "Saved" });
    expect(queued).toHaveLength(1);
  });

  it("merges update() patches into the notification, as a new object", () => {
    // Arrange
    const id = pill().notify({ message: "Saving…", duration: Infinity });
    const before = getStore("main").getState().current;

    // Act
    pill().update(id, { message: "Saved", duration: 3000 });
    pill().update("unknown", { message: "ignored" });

    // Assert
    const after = getStore("main").getState().current;
    expect(after).not.toBe(before);
    expect(after?.input).toMatchObject({ message: "Saved", duration: 3000 });
  });

  it("dismisses the current one or any queued one, and reports why", () => {
    // Arrange
    const onDismiss = vi.fn();
    const first = pill().notify({ message: "1", onDismiss });
    const second = pill().notify({ message: "2", onDismiss });
    const third = pill().notify({ message: "3", onDismiss });

    // Act
    pill().dismiss(second);
    pill().dismiss();

    // Assert
    expect(onDismiss.mock.calls).toEqual([
      [second, "dismissed"],
      [first, "dismissed"],
    ]);
    expect(getStore("main").getState().current?.id).toBe(third);
  });

  it("clears everything", () => {
    // Arrange
    const onDismiss = vi.fn();
    const first = pill().notify({ message: "1", onDismiss });
    const second = pill().notify({ message: "2", onDismiss });

    // Act
    pill().clear();

    // Assert
    expect(getStore("main").getState()).toEqual({ current: null, queued: [] });
    expect(onDismiss.mock.calls).toEqual([
      [first, "cleared"],
      [second, "cleared"],
    ]);
  });

  it("notifies subscribers, and keeps the same state object between changes", () => {
    // Arrange
    const store = getStore("main");
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const empty = store.getState();

    // Act
    pill().notify({ message: "1" });
    const afterNotify = store.getState();
    unsubscribe();
    pill().clear();

    // Assert
    expect(listener).toHaveBeenCalledOnce();
    expect(afterNotify).not.toBe(empty);
    expect(afterNotify).toBe(afterNotify);
  });

  it("does nothing on the server, so requests never share notifications", () => {
    // Arrange
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("document", undefined);

    // Act
    pill().notify({ message: "from a Server Component" });
    vi.unstubAllGlobals();

    // Assert
    expect(getStore("main").getState().current).toBeNull();
    expect(warn.mock.calls[0][0]).toContain('pill("main").notify() was called on the server');
  });

  it("warns when two hosts share a name", () => {
    // Arrange
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = getStore("main");

    // Act
    const unregister = store.registerHost();
    store.registerHost();
    unregister();

    // Assert
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('Several <MagicPill name="main">');
  });
});
