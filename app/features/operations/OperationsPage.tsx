"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  GripVertical,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import FormField from "@/app/abstract/ui/FormField";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import TableSkeleton from "@/app/abstract/ui/TableSkeleton";
import EmptyState from "@/app/abstract/ui/EmptyState";
import HelpHint from "@/app/abstract/ui/HelpHint";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type CropField,
  type Machine,
  type Task,
} from "@/app/base/services/farm-client";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { validate, hasErrors, type Errors, type Rule } from "@/app/lib/validate";

type Tab = "machinery" | "tasks";

const OPERATIONS_ENTITIES = {
  machines: "machines",
  tasks: "tasks",
  fields: "fields",
} as const;

const PRIORITY_COLORS = { high: "#f87171", medium: "#fbbf24", low: "#60a5fa" };
const TASK_COLUMNS: Array<{
  status: Task["status"];
  title: string;
  dot: string;
  badgeClassName: string;
  description: string;
}> = [
  {
    status: "pending",
    title: "Pending",
    dot: "#64748b",
    badgeClassName: "badge-blue",
    description: "New work that is ready to be picked up.",
  },
  {
    status: "in-progress",
    title: "In Progress",
    dot: "#fbbf24",
    badgeClassName: "badge-amber",
    description: "Tasks currently being worked on in the field or yard.",
  },
  {
    status: "done",
    title: "Done",
    dot: "#4ade80",
    badgeClassName: "badge-green",
    description: "Completed work kept here for quick visibility and handoff.",
  },
];
export default function OperationsPage() {
  const [tab, setTab] = useState<Tab>("machinery");
  const { data, reload: load, loading } = useFarmData(OPERATIONS_ENTITIES);
  const machines = data.machines as Machine[];
  const tasks = data.tasks as Task[];
  const fields = data.fields as CropField[];
  const [isOnline, setIsOnline] = useState(true);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [machineForm, setMachineForm] = useState<Partial<Machine>>({});
  const [taskForm, setTaskForm] = useState<Partial<Task>>({});
  const [machineErrors, setMachineErrors] = useState<Record<string, string>>({});
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({});
  const [operationErrors, setOperationErrors] = useState<Errors>({});
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<Task["status"] | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const OPERATION_RULES: Rule[] = [
    { key: "title", label: "Operation type", required: true },
    { key: "fieldName", label: "Field", required: true },
    { key: "assignee", label: "Assignee", required: true },
    { key: "dueDate", label: "Date", required: true },
  ];

  const editTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      fieldName: task.fieldName,
      lat: task.lat,
      lng: task.lng,
      assignee: task.assignee,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
    });
    setOperationErrors({});
    setTaskErrors({});
    setShowAddTask(true);
  };

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    void Promise.resolve().then(() => setIsOnline(navigator.onLine));
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const validateMachine = () => {
    const errors: Record<string, string> = {};
    if (!machineForm.name?.trim()) errors.name = "Machine name is required";
    if (!machineForm.type?.trim()) errors.type = "Type is required";
    if (!machineForm.make?.trim()) errors.make = "Make is required";
    if (!machineForm.model?.trim()) errors.model = "Model is required";
    if (machineForm.year !== undefined && (machineForm.year < 1900 || machineForm.year > 2100)) {
      errors.year = "Invalid year";
    }
    setMachineErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMachine = async () => {
    if (!validateMachine()) return;
    try {
      await saveData("machines", {
        id: editingMachine?.id || generateId(),
        status: machineForm.status || "operational",
        engineHours: machineForm.engineHours ?? 0,
        nextService: machineForm.nextService ?? 500,
        lastService: machineForm.lastService || new Date().toISOString().slice(0, 10),
        ...machineForm,
      } as Machine);
      await load();
      notifications.show({ title: "Success", message: "Machine saved", color: "green" });
      setShowAddMachine(false);
      setEditingMachine(null);
      setMachineForm({});
      setMachineErrors({});
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save machine",
        color: "red",
      });
    }
  };

  const validateTask = () => {
    const errors: Record<string, string> = {};
    if (!taskForm.title?.trim()) errors.title = "Task title is required";
    if (!taskForm.dueDate) errors.dueDate = "Due date is required";
    setTaskErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveTask = async () => {
    const errors = validate(taskForm, OPERATION_RULES);
    if (hasErrors(errors)) {
      setOperationErrors(errors);
      return;
    }
    try {
      await saveData("tasks", {
        id: editingTask?.id || generateId(),
        status: taskForm.status || "pending",
        priority: taskForm.priority || "medium",
        dueDate: taskForm.dueDate || new Date().toISOString().slice(0, 10),
        assignee: taskForm.assignee || "Unassigned",
        description: taskForm.description || "",
        ...taskForm,
      } as Task);
      await load();
      notifications.show({ title: "Success", message: "Task saved", color: "green" });
      setShowAddTask(false);
      setEditingTask(null);
      setTaskForm({});
      setTaskErrors({});
      setOperationErrors({});
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save task",
        color: "red",
      });
    }
  };

  const updateTaskStatus = async (task: Task, status: Task["status"]) => {
    if (task.status === status) return;
    try {
      setUpdatingTaskId(task.id);
      await saveData("tasks", { ...task, status });
      await load();
      notifications.show({ title: "Success", message: "Task status updated", color: "green" });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update task status",
        color: "red",
      });
    } finally {
      setUpdatingTaskId(null);
      setDraggedTaskId(null);
      setDropTargetStatus(null);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const tasksByStatus: Record<Task["status"], Task[]> = {
    pending: pendingTasks,
    "in-progress": inProgressTasks,
    done: doneTasks,
  };

  const maintenanceDue = machines.filter((m) => m.nextService < 200);
  const breakdown = machines.filter((m) => m.status === "breakdown");

  const startTaskDrag = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const finishTaskDrag = () => {
    setDraggedTaskId(null);
    setDropTargetStatus(null);
  };

  const moveTaskToColumn = async (status: Task["status"]) => {
    if (!draggedTaskId) return;
    const task = tasks.find((item) => item.id === draggedTaskId);
    if (!task) return;
    await updateTaskStatus(task, status);
  };

  if (loading) return <TableSkeleton rows={5} cols={5} />;

  return (
    <div style={{ padding: 24 }}>
      {/* Offline banner */}
      <div
        style={{
          marginBottom: isOnline ? 0 : 16,
          overflow: "hidden",
          maxHeight: isOnline ? 0 : 80,
          transition: "max-height 0.3s",
        }}
      >
        <div
          style={{
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.3)",
            borderRadius: 10,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <WifiOff size={16} color="#fbbf24" />
          <span
            style={{ color: "#fbbf24", fontWeight: 600, fontSize: "0.85rem" }}
          >
            Offline Mode — Data is being saved locally and will sync when
            connection is restored
          </span>
        </div>
      </div>

      <div
        style={{
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            className="text-primary"
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            ⚙️ Operations & Logistics
          </h1>
          <p
            className="text-muted"
            style={{
              fontSize: "0.875rem",
              marginTop: 4,
            }}
          >
            Machinery maintenance, geofenced task assignments, and field
            operations
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            background: isOnline
              ? "rgba(74,222,128,0.1)"
              : "rgba(251,191,36,0.1)",
            border: `1px solid ${isOnline ? "rgba(74,222,128,0.3)" : "rgba(251,191,36,0.3)"}`,
          }}
        >
          {isOnline ? (
            <Wifi size={14} color="#4ade80" />
          ) : (
            <WifiOff size={14} color="#fbbf24" />
          )}
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: isOnline ? "#4ade80" : "#fbbf24",
            }}
          >
            {isOnline ? "Online · Auto-saving" : "Offline · Local save"}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Machines"
          value={machines.length}
          sub={`${machines.filter((m) => m.status === "operational").length} operational`}
          icon={Wrench}
          color="#2dd4bf"
          delay={0}
        />
        <StatCard
          label="Service Due"
          value={maintenanceDue.length}
          icon={AlertTriangle}
          color={maintenanceDue.length > 0 ? "#f87171" : "#4ade80"}
          delay={60}
        />
        <StatCard
          label="Active Tasks"
          value={pendingTasks.length + inProgressTasks.length}
          sub={`${doneTasks.length} completed`}
          icon={CheckCircle}
          color="#a78bfa"
          delay={120}
        />
        <StatCard
          label="Breakdowns"
          value={breakdown.length}
          icon={AlertTriangle}
          color={breakdown.length > 0 ? "#f87171" : "#4ade80"}
          delay={180}
        />
      </div>

      {/* Tabs */}
      <div
        className="bg-card border border-border"
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          padding: 4,
          borderRadius: 10,
          width: "fit-content",
        }}
      >
        {(
          [
            ["machinery", "🚜 Machinery"],
            ["tasks", "📋 Geofenced Tasks"],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: tab === t ? 600 : 400,
              background: tab === t ? "rgba(45,212,191,0.15)" : "transparent",
              color: tab === t ? "#2dd4bf" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Machinery */}
      {tab === "machinery" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {maintenanceDue.length > 0 && (
            <div
              style={{
                background: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: 10,
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.85rem",
                  color: "#f87171",
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={14} /> Service due within 200 engine hours:{" "}
                {maintenanceDue.map((m) => m.name).join(", ")}
              </div>
            </div>
          )}

          <div
            className="bg-card border border-border"
            style={{
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              className="border-b border-border"
              style={{
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Equipment Registry
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddMachine(true)}
              >
                <Plus size={14} /> Add Machine
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Machine</th>
                    <th>Type</th>
                    <th>Year</th>
                    <th>Engine Hours</th>
                    <th>Last Service</th>
                    <th>Hours to Next Service</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.length === 0 ? (
                    <tr><td colSpan={99}><div style={{textAlign:"center",padding:"32px 16px",fontSize:"0.875rem",color:"var(--text-muted)"}}>No machinery registered yet.</div></td></tr>
                  ) : machines.map((m) => {
                    const urgency =
                      m.nextService < 100
                        ? "#f87171"
                        : m.nextService < 200
                          ? "#fbbf24"
                          : "#4ade80";
                    return (
                      <tr key={m.id}>
                        <td>
                        <div
                          className="text-primary"
                          style={{
                            fontWeight: 600,
                            fontSize: "0.85rem",
                          }}
                        >
                          {m.name}
                        </div>
                        <div
                          className="text-muted"
                          style={{
                            fontSize: "0.72rem",
                          }}
                        >
                          {m.make} {m.model}
                        </div>
                        </td>
                        <td>{m.type}</td>
                        <td>{m.year}</td>
                        <td
                          className="text-primary"
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 600,
                          }}
                        >
                          {m.engineHours.toLocaleString()} hrs
                        </td>
                        <td>
                          {new Date(m.lastService).toLocaleDateString("en-GB")}
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: 6,
                                background: "rgba(255,255,255,0.06)",
                                borderRadius: 4,
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  borderRadius: 4,
                                  background: urgency,
                                  width: `${Math.min(100, Math.max(5, 100 - (m.nextService / 500) * 100))}%`,
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: urgency,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {m.nextService} hrs
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              background: `${m.status === "operational" ? "#4ade80" : m.status === "breakdown" ? "#f87171" : "#fbbf24"}18`,
                              color:
                                m.status === "operational"
                                  ? "#4ade80"
                                  : m.status === "breakdown"
                                    ? "#f87171"
                                    : "#fbbf24",
                              border: `1px solid ${m.status === "operational" ? "#4ade80" : m.status === "breakdown" ? "#f87171" : "#fbbf24"}30`,
                              padding: "2px 10px",
                              borderRadius: 999,
                              fontSize: "0.72rem",
                              fontWeight: 600,
                            }}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="btn-ghost"
                            title="Edit machine"
                            style={{ padding: "4px 8px" }}
                            onClick={() => {
                              setEditingMachine(m);
                              setMachineForm({
                                name: m.name,
                                type: m.type,
                                make: m.make,
                                model: m.model,
                                year: m.year,
                                engineHours: m.engineHours,
                                lastService: m.lastService,
                                nextService: m.nextService,
                                status: m.status,
                              });
                              setMachineErrors({});
                              setShowAddMachine(true);
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-danger"
                            title="Delete machine"
                            style={{ padding: "4px 8px" }}
                            onClick={async () => {
                              try {
                                await deleteData("machines", m.id);
                                await load();
                                notifications.show({ title: "Success", message: "Machine deleted", color: "green" });
                              } catch (error) {
                                notifications.show({
                                  title: "Error",
                                  message: error instanceof Error ? error.message : "Failed to delete machine",
                                  color: "red",
                                });
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Task Board */}
      {tab === "tasks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            className="surface-panel"
            style={{
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div>
                <div className="section-kicker">Task board</div>
                <div
                  className="text-primary"
                  style={{ marginTop: 6, fontSize: "1.2rem", fontWeight: 700 }}
                >
                  Assign work, move it across the board, and keep ownership clear.
                </div>
                <p
                  className="text-secondary"
                  style={{ marginTop: 6, fontSize: "0.9rem", maxWidth: 720, lineHeight: 1.6 }}
                >
                  Drag a task from one column to another to update its status. Every card carries the
                  assignee, due date, field context, and priority so the whole farm can see what is moving.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div className="surface-inset" style={{ padding: "10px 14px", minWidth: 132 }}>
                  <div className="text-muted" style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    Open tasks
                  </div>
                  <div className="text-primary" style={{ marginTop: 6, fontSize: "1.35rem", fontWeight: 700 }}>
                    {pendingTasks.length + inProgressTasks.length}
                  </div>
                </div>
                <div className="surface-inset" style={{ padding: "10px 14px", minWidth: 132 }}>
                  <div className="text-muted" style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    Completed
                  </div>
                  <div className="text-primary" style={{ marginTop: 6, fontSize: "1.35rem", fontWeight: 700 }}>
                    {doneTasks.length}
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => setShowAddTask(true)}
                >
                  <Plus size={14} /> Create Task
                </button>
              </div>
            </div>
            <div className="surface-inset" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <GripVertical size={14} className="text-muted" />
              <span className="text-secondary" style={{ fontSize: "0.82rem" }}>
                Drag or touch cards between columns to update status. Changes save immediately.
              </span>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
              gap: 16,
              overflowX: "auto",
              alignItems: "start",
            }}
          >
            {TASK_COLUMNS.map((column) => (
              <TaskColumn
                key={column.status}
                column={column}
                tasks={tasksByStatus[column.status]}
                isActiveDropTarget={dropTargetStatus === column.status}
                onDragOver={() => setDropTargetStatus(column.status)}
                onDrop={() => void moveTaskToColumn(column.status)}
              >
                {tasksByStatus[column.status].length === 0 ? (
                  <div
                    className="surface-inset"
                    style={{
                      minHeight: 180,
                      padding: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <div className="text-primary" style={{ fontSize: "0.88rem", fontWeight: 600 }}>
                        No {column.title.toLowerCase()} tasks.
                      </div>
                      <div className="text-muted" style={{ marginTop: 6, fontSize: "0.78rem", lineHeight: 1.5 }}>
                        Tasks moved into {column.title.toLowerCase()} will appear here.
                      </div>
                    </div>
                  </div>
                ) : tasksByStatus[column.status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isDragging={draggedTaskId === task.id}
                    isUpdating={updatingTaskId === task.id}
                    onDragStart={() => startTaskDrag(task.id)}
                    onDragEnd={finishTaskDrag}
                    onUpdateStatus={updateTaskStatus}
                    onEdit={() => editTask(task)}
                    onDelete={async () => {
                      try {
                        await deleteData("tasks", task.id);
                        await load();
                        notifications.show({ title: "Success", message: "Task deleted", color: "green" });
                      } catch (error) {
                        notifications.show({
                          title: "Error",
                          message: error instanceof Error ? error.message : "Failed to delete task",
                          color: "red",
                        });
                      }
                    }}
                  />
                ))}
              </TaskColumn>
            ))}
          </div>
        </div>
      )}

      {/* Add Machine Modal */}
      {showAddMachine && (
        <Modal title={editingMachine ? `Edit Machine — ${editingMachine.name}` : "Add Machine"} onClose={() => { setShowAddMachine(false); setEditingMachine(null); setMachineErrors({}); setMachineForm({}); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              label="Machine Name"
              name="name"
              type="text"
              placeholder="John Deere 6R 150"
              required
              error={machineErrors.name}
              value={String(machineForm.name ?? "")}
              onChange={(e) => setMachineForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                label="Type"
                name="type"
                type="text"
                placeholder="Tractor"
                required
                error={machineErrors.type}
                value={String(machineForm.type ?? "")}
                onChange={(e) => setMachineForm((f) => ({ ...f, type: e.target.value }))}
              />
              <FormField
                label="Year"
                name="year"
                type="number"
                placeholder="2022"
                error={machineErrors.year}
                value={String(machineForm.year ?? "")}
                onChange={(e) => setMachineForm((f) => ({ ...f, year: +e.target.value }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                label="Make"
                name="make"
                type="text"
                placeholder="John Deere"
                required
                error={machineErrors.make}
                value={String(machineForm.make ?? "")}
                onChange={(e) => setMachineForm((f) => ({ ...f, make: e.target.value }))}
              />
              <FormField
                label="Model"
                name="model"
                type="text"
                placeholder="6R 150"
                required
                error={machineErrors.model}
                value={String(machineForm.model ?? "")}
                onChange={(e) => setMachineForm((f) => ({ ...f, model: e.target.value }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                label="Engine Hours"
                name="engineHours"
                type="number"
                placeholder="0"
                value={String(machineForm.engineHours ?? "")}
                onChange={(e) => setMachineForm((f) => ({ ...f, engineHours: +e.target.value }))}
              />
              <FormField
                label="Hours to Next Service"
                name="nextService"
                type="number"
                placeholder="500"
                helperText="Hours until maintenance due"
                value={String(machineForm.nextService ?? "")}
                onChange={(e) => setMachineForm((f) => ({ ...f, nextService: +e.target.value }))}
              />
            </div>
            <FormField
              label="Last Service Date"
              name="lastService"
              type="date"
              value={String(machineForm.lastService ?? new Date().toISOString().slice(0, 10))}
              onChange={(e) => setMachineForm((f) => ({ ...f, lastService: e.target.value }))}
            />
            <FormField
              as="select"
              label="Machine status"
              name="status"
              value={machineForm.status ?? "operational"}
              onChange={(e) => setMachineForm((f) => ({ ...f, status: e.target.value as Machine["status"] }))}
            >
              {["operational", "maintenance", "breakdown"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </FormField>
            <Group grow mt={4}>
              <Button onClick={saveMachine}>{editingMachine ? "Update Machine" : "Add Machine"}</Button>
              <Button variant="default" onClick={() => { setShowAddMachine(false); setEditingMachine(null); setMachineErrors({}); setMachineForm({}); }}>
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <Modal title={editingTask ? `Edit Task — ${editingTask.title}` : "Create Task"} onClose={() => { setShowAddTask(false); setEditingTask(null); setTaskErrors({}); setTaskForm({}); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              label="Task Title"
              name="title"
              type="text"
              placeholder="Spray North Meadow"
              required
              error={operationErrors.title}
               value={String(taskForm.title ?? "")}
               onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
            />
            <FormField
              label="Description"
              name="description"
              as="textarea"
              placeholder="Optional details…"
              rows={2}
              value={String(taskForm.description ?? "")}
              onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                as="select"
              label={<span className="inline-flex items-center gap-1.5">Field / Location <HelpHint label="Pick the field this work belongs to. If the task is not field-specific, use the nearest operational area naming convention." /></span>}
                name="fieldName"
                required
                error={operationErrors.fieldName}
                helperText={
                  fields.length > 0
                    ? "Choose the field or location for this task."
                    : "No fields available yet. Create one in Crops & Fields before assigning field work."
                }
                disabled={fields.length === 0}
                value={taskForm.fieldName ?? ""}
                onChange={(e) => setTaskForm((f) => ({ ...f, fieldName: e.target.value }))}
              >
                <option value="">Select field...</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </FormField>
              <FormField
                label={<span className="inline-flex items-center gap-1.5">Assignee <HelpHint label="Use the person, crew, or contractor responsible for completing the work so task ownership stays clear." /></span>}
                name="assignee"
                placeholder="e.g. Field crew A"
                helperText="Enter the assignee directly. Use a consistent name to keep task history clean."
                required
                error={operationErrors.assignee}
                value={taskForm.assignee ?? ""}
                onChange={(e) => setTaskForm((f) => ({ ...f, assignee: e.target.value }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                label="GPS Lat"
                name="lat"
                type="number"
                placeholder="53.95"
                value={String(taskForm.lat ?? "")}
                onChange={(e) => setTaskForm((f) => ({ ...f, lat: +e.target.value }))}
              />
              <FormField
                label="GPS Lng"
                name="lng"
                type="number"
                placeholder="-1.08"
                value={String(taskForm.lng ?? "")}
                onChange={(e) => setTaskForm((f) => ({ ...f, lng: +e.target.value }))}
              />
            </div>
            <FormField
              label="Due Date"
              name="dueDate"
              type="date"
              required
              error={operationErrors.dueDate}
               value={String(taskForm.dueDate ?? "")}
               onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                as="select"
                label="Priority"
                name="priority"
                value={taskForm.priority ?? "medium"}
                onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value as Task["priority"] }))}
              >
                {["low", "medium", "high"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </FormField>
              <FormField
                as="select"
                label="Task status"
                name="status"
                value={taskForm.status ?? "pending"}
                onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value as Task["status"] }))}
              >
                {["pending", "in-progress", "done"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </FormField>
            </div>
            <Group grow mt={4}>
              <Button onClick={saveTask}>{editingTask ? "Update Task" : "Create Task"}</Button>
              <Button variant="default" onClick={() => { setShowAddTask(false); setEditingTask(null); setOperationErrors({}); setTaskErrors({}); setTaskForm({}); }}>
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TaskColumn({
  column,
  tasks,
  children,
  isActiveDropTarget,
  onDragOver,
  onDrop,
}: {
  column: (typeof TASK_COLUMNS)[number];
  tasks: Task[];
  children: React.ReactNode;
  isActiveDropTarget: boolean;
  onDragOver: () => void;
  onDrop: () => void;
}) {
  return (
    <section
      className="surface-panel"
      data-column-status={column.status}
      style={{
        minWidth: 260,
        padding: 14,
        background: isActiveDropTarget ? "var(--bg-card-hover)" : undefined,
        borderColor: isActiveDropTarget ? "var(--border-accent)" : undefined,
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDragLeave={() => undefined}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      onTouchMove={(e) => {
        const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
        const col = el?.closest("[data-column-status]");
        if (col && col.getAttribute("data-column-status") === column.status) {
          onDragOver();
        }
      }}
      onTouchEnd={(e) => {
        const el = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        const col = el?.closest("[data-column-status]");
        if (col && col.getAttribute("data-column-status") === column.status) {
          onDrop();
        }
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: column.dot,
          }}
        />
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {column.title}
        </span>
        <span className={column.badgeClassName}>{tasks.length}</span>
      </div>
      <p className="text-muted" style={{ fontSize: "0.76rem", lineHeight: 1.5, marginBottom: 12 }}>
        {column.description}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  onUpdateStatus,
  onDelete,
  onEdit,
  onDragStart,
  onDragEnd,
  isDragging,
  isUpdating,
}: {
  task: Task;
  onUpdateStatus: (task: Task, status: Task["status"]) => void;
  onDelete: () => void;
  onEdit?: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isUpdating: boolean;
}) {
  return (
    <div
      className="bg-card"
      draggable={!isUpdating}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={(e) => { if (!isUpdating) { onDragStart(); } }}
      style={{
        border: `1px solid ${task.priority === "high" ? "rgba(248,113,113,0.2)" : task.priority === "medium" ? "rgba(251,191,36,0.15)" : "var(--border)"}`,
        borderRadius: 10,
        padding: "14px",
        cursor: isUpdating ? "progress" : "grab",
        opacity: isDragging ? 0.55 : 1,
        boxShadow: isDragging ? "0 18px 36px rgba(30,41,33,0.12)" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
          <GripVertical size={15} className="text-muted" style={{ flexShrink: 0, marginTop: 1 }} />
          <span
            className="text-primary"
            style={{
              fontWeight: 600,
              fontSize: "0.82rem",
              lineHeight: 1.3,
            }}
          >
            {task.title}
          </span>
        </div>
        <span
          style={{
            background: `${PRIORITY_COLORS[task.priority]}18`,
            color: PRIORITY_COLORS[task.priority],
            border: `1px solid ${PRIORITY_COLORS[task.priority]}30`,
            padding: "1px 6px",
            borderRadius: 4,
            fontSize: "0.68rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            marginLeft: 8,
          }}
        >
          {task.priority}
        </span>
      </div>
      {task.description && (
        <div
          className="text-muted"
          style={{
            fontSize: "0.75rem",
            marginBottom: 8,
            lineHeight: 1.4,
          }}
        >
          {task.description.slice(0, 100)}
          {task.description.length > 100 ? "…" : ""}
        </div>
      )}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}
      >
        {task.fieldName && (
          <span
            style={{
              fontSize: "0.7rem",
              color: "#4ade80",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <MapPin size={10} /> {task.fieldName}
            {task.lat && (
            <span className="text-muted">
              {" "}
              ({task.lat.toFixed(3)}, {task.lng?.toFixed(3)})
            </span>
            )}
          </span>
        )}
        <span
          className="text-muted"
          style={{
            fontSize: "0.7rem",
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Clock size={10} />{" "}
          {new Date(task.dueDate).toLocaleDateString("en-GB")}
        </span>
      </div>
      <div
        className="text-muted"
        style={{
          fontSize: "0.72rem",
          marginBottom: 10,
        }}
      >
        👤 {task.assignee}
      </div>
      {isUpdating && (
        <div className="text-muted" style={{ fontSize: "0.7rem", marginBottom: 10 }}>
          Saving board update...
        </div>
      )}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {task.status !== "pending" && (
          <button
            onClick={() => onUpdateStatus(task, "pending")}
            className="text-muted border border-border"
            style={{
              flex: 1,
              padding: "5px",
              borderRadius: 5,
              background: "transparent",
              cursor: isUpdating ? "progress" : "pointer",
              fontSize: "0.68rem",
            }}
            disabled={isUpdating}
          >
            Pending
          </button>
        )}
        {task.status !== "in-progress" && (
          <button
            onClick={() => onUpdateStatus(task, "in-progress")}
            style={{
              flex: 1,
              padding: "5px",
              borderRadius: 5,
              border: "1px solid rgba(251,191,36,0.3)",
              background: "rgba(251,191,36,0.08)",
              cursor: isUpdating ? "progress" : "pointer",
              fontSize: "0.68rem",
              color: "#fbbf24",
            }}
            disabled={isUpdating}
          >
            In Progress
          </button>
        )}
        {task.status !== "done" && (
          <button
            onClick={() => onUpdateStatus(task, "done")}
            style={{
              flex: 1,
              padding: "5px",
              borderRadius: 5,
              border: "1px solid rgba(74,222,128,0.3)",
              background: "rgba(74,222,128,0.08)",
              cursor: isUpdating ? "progress" : "pointer",
              fontSize: "0.68rem",
              color: "#4ade80",
            }}
            disabled={isUpdating}
          >
            Done ✓
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            title="Edit task"
            style={{
              padding: "5px 7px",
              borderRadius: 5,
              border: "1px solid rgba(96,165,250,0.3)",
              background: "rgba(96,165,250,0.08)",
              cursor: isUpdating ? "progress" : "pointer",
              color: "#60a5fa",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
            disabled={isUpdating}
          >
            <Pencil size={12} />
          </button>
        )}
        <button
          onClick={onDelete}
          title="Delete task"
          style={{
            padding: "5px 7px",
            borderRadius: 5,
            border: "1px solid rgba(248,113,113,0.3)",
            background: "rgba(248,113,113,0.08)",
            cursor: isUpdating ? "progress" : "pointer",
            color: "#f87171",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
          disabled={isUpdating}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}









