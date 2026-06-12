"use client";

import { Card, Group, Text } from "@mantine/core";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: string;
  trend?: { value: number; label: string };
  delay?: number;
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "#4ade80",
  trend,
}: StatCardProps) {
  return (
    <Card
      padding="lg"
      radius="md"
      className="border border-border"
      style={{
        animationDelay: "0ms",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none" style={{ background: color, opacity: 0.06 }} />
      <Group justify="space-between" align="flex-start">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon size={20} color={color} strokeWidth={2} />
        </div>
        {trend && (
          <Text
            size="xs"
            fw={600}
            className={`px-2 py-0.5 rounded-md ${
              trend.value >= 0
                ? "bg-[rgba(74,222,128,0.1)] text-green"
                : "bg-[rgba(248,113,113,0.1)] text-red"
            }`}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </Text>
        )}
      </Group>
      <div className="mt-3">
        <Text size="28px" fw={700} className="text-primary leading-none">
          {value}
        </Text>
        <Text size="sm" className="text-muted mt-1">
          {label}
        </Text>
        {sub && (
          <Text size="xs" className="text-muted mt-0.5">
            {sub}
          </Text>
        )}
      </div>
      {trend && <Text size="xs" className="text-muted mt-3">{trend.label}</Text>}
    </Card>
  );
}
