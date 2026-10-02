// What the editor should prefill: the content as it is right now. In dev/local
// that means reading the file back from disk, so a save is reflected on reload
// even before a module-graph refresh. In production it is the bundled content
// (what the live site renders until the next deploy). Node-only.

import { capabilities, clientsForDisplay, contact } from "../content.ts";
import type { Section } from "./sections.ts";
import { persistenceMode, readSectionFromDisk } from "./store.ts";

function bundled(section: Section): unknown {
  switch (section.id) {
    case "contact":
      return contact;
    case "capabilities":
      return capabilities;
    case "clients":
      return clientsForDisplay();
  }
}

export async function currentContent(section: Section): Promise<unknown> {
  if (persistenceMode() === "fs") {
    try {
      return await readSectionFromDisk(section.file);
    } catch {
      // Fall through to the bundled copy if the file can't be read.
    }
  }
  return bundled(section);
}
