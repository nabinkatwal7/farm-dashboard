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
import { useCallback, useEffect, useState } from "react";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
import {
  deleteData,
  generateId,
  getData,
  saveData,
  type Machine,
  type Task,
} from "../lib/store";

type Tab = "machinery" | "tasks";

const PRIORITY_COLORS = { high: "#f87171", medium: "#fbbf24", low: "#60a5fa" };
export default function OperationsPage() {
  const [tab, setTab] = useState<Tab>("machinery");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [machineForm, setMachineForm] = useState<Partial<Machine>>({});
  const [taskForm, setTaskForm] = useState<Partial<Task>>({});

  const load = useCallback(async () => {
    setMachines(await getData<Machine>("machines"));
    setTasks(await getData<Task>("tasks"));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    void Promise.resolve().then(() => setIsOnline(navigator.onLine));
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, [load]);

  const saveMachine = async () => {
    if (!machineForm.name) return;
    await saveData("machines", {
      id: generateId(),
      status: "operational",
      engineHours: 0,
      nextService: 500,
      lastService: new Date().toISOString().slice(0, 10),
      ...machineForm,
    } as Machine);
    await load();
    setShowAddMachine(false);
    setMachineForm({});
  };

  const saveTask = async () => {
    if (!taskForm.title) return;
    await saveData("tasks", {
      id: generateId(),
      status: "pending",
      priority: "medium",
      dueDate: new Date().toISOString().slice(0, 10),
      assignee: "Unassigned",
      description: "",
      ...taskForm,
    } as Task);
    await load();
    setShowAddTask(false);
    setTaskForm({});
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
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            ⚙️ Operations & Logistics
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
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
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
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
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
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
                            style={{
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              fontSize: "0.85rem",
                            }}
                          >
                            {m.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {m.make} {m.model}
                          </div>
                        </td>
                        <td>{m.type}</td>
                        <td>{m.year}</td>
                        <td
                          style={{
                            fontFamily: "monospace",
                            color: "var(--text-primary)",
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
        <Modal title="Add Machine" onClose={() => setShowAddMachine(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["Machine Name", "name", "text", "John Deere 6R 150"],
              ["Type", "type", "text", "Tractor"],
              ["Make", "make", "text", "John Deere"],
              ["Model", "model", "text", "6R 150"],
              ["Year", "year", "number", "2022"],
              ["Engine Hours", "engineHours", "number", "0"],
              ["Hours to Next Service", "nextService", "number", "500"],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </label>
                <input
                  className="farm-input"
                  type={type}
                  placeholder={placeholder}
                  value={String((machineForm as Record<string, unknown>)[key] ?? "")}
                  onChange={(e) =>
                    setMachineForm((f) => ({
                      ...f,
                      [key]:
                        type === "number" ? +e.target.value : e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveMachine}
              >
                Add Machine
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddMachine(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <Modal title="Create Task" onClose={() => setShowAddTask(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["Task Title", "title", "text", "Spray North Meadow"],
              ["Description", "description", "text", "Optional details…"],
              ["Field / Location", "fieldName", "text", "North Meadow"],
              ["GPS Lat", "lat", "number", "53.95"],
              ["GPS Lng", "lng", "number", "-1.08"],
              ["Assignee", "assignee", "text", "Tom Greene"],
              ["Due Date", "dueDate", "date", ""],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </label>
                <input
                  className="farm-input"
                  type={type}
                  placeholder={placeholder}
                  value={String((taskForm as Record<string, unknown>)[key] ?? "")}
                  onChange={(e) =>
                    setTaskForm((f) => ({
                      ...f,
                      [key]:
                        type === "number" ? +e.target.value : e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Priority
              </label>
              <select
                className="farm-input"
                value={taskForm.priority ?? "medium"}
                onChange={(e) =>
                  setTaskForm((f) => ({
                    ...f,
                    priority: e.target.value as Task["priority"],
                  }))
                }
              >
                {["low", "medium", "high"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveTask}
              >
                Create Task
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddTask(false)}
              >
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
      style={{
        background: "var(--bg-card)",
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
          style={{
            fontWeight: 600,
            fontSize: "0.82rem",
            color: "var(--text-primary)",
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
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
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
              <span style={{ color: "var(--text-muted)" }}>
                {" "}
                ({task.lat.toFixed(3)}, {task.lng?.toFixed(3)})
              </span>
            )}
          </span>
        )}
        <span
          style={{
            fontSize: "0.7rem",
            color: "var(--text-muted)",
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
        style={{
          fontSize: "0.72rem",
          color: "var(--text-muted)",
          marginBottom: 10,
        }}
      >
        👤 {task.assignee}
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {task.status !== "pending" && (
          <button
            onClick={() => onUpdateStatus(task, "pending")}
            style={{
              flex: 1,
              padding: "5px",
              borderRadius: 5,
              border: "1px solid var(--border)",
              background: "transparent",
              cursor: "pointer",
              fontSize: "0.68rem",
              color: "var(--text-muted)",
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







