"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
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
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type Machine,
  type Task,
} from "@/app/base/services/farm-client";

type Tab = "machinery" | "tasks";

const OPERATIONS_ENTITIES = {
  machines: "machines",
  tasks: "tasks",
} as const;

const PRIORITY_COLORS = { high: "#f87171", medium: "#fbbf24", low: "#60a5fa" };
export default function OperationsPage() {
  const [tab, setTab] = useState<Tab>("machinery");
  const { data, reload: load } = useFarmData(OPERATIONS_ENTITIES);
  const machines = data.machines as Machine[];
  const tasks = data.tasks as Task[];
  const [isOnline, setIsOnline] = useState(true);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [machineForm, setMachineForm] = useState<Partial<Machine>>({});
  const [taskForm, setTaskForm] = useState<Partial<Task>>({});
  const [machineErrors, setMachineErrors] = useState<Record<string, string>>({});
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({});

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
    await saveData("machines", {
      id: generateId(),
      status: machineForm.status || "operational",
      engineHours: machineForm.engineHours ?? 0,
      nextService: machineForm.nextService ?? 500,
      lastService: machineForm.lastService || new Date().toISOString().slice(0, 10),
      ...machineForm,
    } as Machine);
    await load();
    setShowAddMachine(false);
    setMachineForm({});
    setMachineErrors({});
  };

  const validateTask = () => {
    const errors: Record<string, string> = {};
    if (!taskForm.title?.trim()) errors.title = "Task title is required";
    if (!taskForm.dueDate) errors.dueDate = "Due date is required";
    setTaskErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveTask = async () => {
    if (!validateTask()) return;
    await saveData("tasks", {
      id: generateId(),
      status: taskForm.status || "pending",
      priority: taskForm.priority || "medium",
      dueDate: taskForm.dueDate || new Date().toISOString().slice(0, 10),
      assignee: taskForm.assignee || "Unassigned",
      description: taskForm.description || "",
      ...taskForm,
    } as Task);
    await load();
    setShowAddTask(false);
    setTaskForm({});
    setTaskErrors({});
  };

  const updateTaskStatus = async (task: Task, status: Task["status"]) => {
    await saveData("tasks", { ...task, status });
    await load();
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const maintenanceDue = machines.filter((m) => m.nextService < 200);
  const breakdown = machines.filter((m) => m.status === "breakdown");

  return (
    <div style={{ padding: "32px 32px 48px" }}>
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
                  {machines.map((m) => {
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
                          <button
                            className="btn-danger"
                            title="Delete machine"
                            style={{ padding: "4px 8px" }}
                            onClick={async () => {
                              await deleteData("machines", m.id);
                              await load();
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
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
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-primary"
              onClick={() => setShowAddTask(true)}
            >
              <Plus size={14} /> Create Task
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
            }}
          >
            {/* Pending */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#64748b",
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
                  Pending
                </span>
                <span className="badge-blue">{pendingTasks.length}</span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdateStatus={updateTaskStatus}
                    onDelete={async () => {
                      await deleteData("tasks", task.id);
                      await load();
                    }}
                  />
                ))}
              </div>
            </div>

            {/* In Progress */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#fbbf24",
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
                  In Progress
                </span>
                <span className="badge-amber">{inProgressTasks.length}</span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {inProgressTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdateStatus={updateTaskStatus}
                    onDelete={async () => {
                      await deleteData("tasks", task.id);
                      await load();
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Done */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#4ade80",
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
                  Done
                </span>
                <span className="badge-green">{doneTasks.length}</span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {doneTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdateStatus={updateTaskStatus}
                    onDelete={async () => {
                      await deleteData("tasks", task.id);
                      await load();
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Machine Modal */}
      {showAddMachine && (
        <Modal title="Add Machine" onClose={() => { setShowAddMachine(false); setMachineErrors({}); }}>
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
            <div>
              <label className="text-muted" style={{ fontSize: "0.8rem", display: "block", marginBottom: 6, fontWeight: 500 }}>
                Status
              </label>
              <select
                className="farm-input"
                value={machineForm.status ?? "operational"}
                onChange={(e) => setMachineForm((f) => ({ ...f, status: e.target.value as Machine["status"] }))}
              >
                {["operational", "maintenance", "breakdown"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={saveMachine}>
                Add Machine
              </button>
              <button className="btn-ghost" onClick={() => { setShowAddMachine(false); setMachineErrors({}); }}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <Modal title="Create Task" onClose={() => { setShowAddTask(false); setTaskErrors({}); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              label="Task Title"
              name="title"
              type="text"
              placeholder="Spray North Meadow"
              required
              error={taskErrors.title}
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
                label="Field / Location"
                name="fieldName"
                type="text"
                placeholder="North Meadow"
                value={String(taskForm.fieldName ?? "")}
                onChange={(e) => setTaskForm((f) => ({ ...f, fieldName: e.target.value }))}
              />
              <FormField
                label="Assignee"
                name="assignee"
                type="text"
                placeholder="Tom Greene"
                value={String(taskForm.assignee ?? "")}
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
              error={taskErrors.dueDate}
              value={String(taskForm.dueDate ?? "")}
              onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="text-muted" style={{ fontSize: "0.8rem", display: "block", marginBottom: 6, fontWeight: 500 }}>
                  Priority
                </label>
                <select
                  className="farm-input"
                  value={taskForm.priority ?? "medium"}
                  onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value as Task["priority"] }))}
                >
                  {["low", "medium", "high"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: "0.8rem", display: "block", marginBottom: 6, fontWeight: 500 }}>
                  Status
                </label>
                <select
                  className="farm-input"
                  value={taskForm.status ?? "pending"}
                  onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value as Task["status"] }))}
                >
                  {["pending", "in-progress", "done"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={saveTask}>
                Create Task
              </button>
              <button className="btn-ghost" onClick={() => { setShowAddTask(false); setTaskErrors({}); }}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onUpdateStatus,
  onDelete,
}: {
  task: Task;
  onUpdateStatus: (task: Task, status: Task["status"]) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="bg-card"
      style={{
        border: `1px solid ${task.priority === "high" ? "rgba(248,113,113,0.2)" : task.priority === "medium" ? "rgba(251,191,36,0.15)" : "var(--border)"}`,
        borderRadius: 10,
        padding: "14px",
        cursor: "default",
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
              cursor: "pointer",
              fontSize: "0.68rem",
            }}
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
              cursor: "pointer",
              fontSize: "0.68rem",
              color: "#fbbf24",
            }}
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
              cursor: "pointer",
              fontSize: "0.68rem",
              color: "#4ade80",
            }}
          >
            Done ✓
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
            cursor: "pointer",
            color: "#f87171",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}









