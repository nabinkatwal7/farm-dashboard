"use client";

import { Tooltip } from "@mantine/core";
import { CircleHelp } from "lucide-react";

export default function HelpHint({
  label,
  width = 260,
}: {
  label: string;
  width?: number;
}) {
  return (
    <Tooltip
      label={label}
      withArrow
      multiline
      w={width}
      transitionProps={{ duration: 120 }}
      color="dark"
    >
      <button
        type="button"
        aria-label="Help"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted transition-colors hover:text-primary"
        onClick={(event) => event.preventDefault()}
      >
        <CircleHelp size={15} />
      </button>
    </Tooltip>
  );
}
