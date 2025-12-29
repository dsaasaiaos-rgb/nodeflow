import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { createPageUrl } from "@/utils";

const LS_KEY = "master_hub_db_v1";

const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

const fmtDateTime = (ms) => {
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (s) => {
  switch (s) {
    case "ACTIVE":
      return "Active";
    case "NEEDS_REVIEW":
      return "Needs Review";
    case "ON_HOLD":
      return "On Hold";
    case "ARCHIVED":
      return "Archived";
    default:
      return s;
  }
};

const statusDotClass = (s) => {
  switch (s) {
    case "ACTIVE":
      return "bg-emerald-500";
    case "NEEDS_REVIEW":
      return "bg-yellow-500";
    case "ON_HOLD":
      return "bg-slate-400";
    case "ARCHIVED":
      return "bg-gray-500";
    default:
      return "bg-slate-400";
  }
};

const permissionRank = (p) => (p === "EDIT" ? 2 : p === "VIEW" ? 1 : 0);

function seedDB() {
  const owner = {
    id: "u_owner",
    name: "Stephen (Owner)",
    email: "owner@company.com",
    role: "OWNER",
    status: "ACTIVE",
  };

  const assistant = {
    id: "u_asst",
    name: "Assistant",
    email: "assistant@company.com",
    role: "ASSISTANT",
    status: "ACTIVE",
  };

  const sethNode = {
    id: "n_seth",
    projectName: "Seth — Campaign Website",
    status: "ACTIVE",
    ownerId: owner.id,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    updatedAt: Date.now() - 1000 * 60 * 20,
    overview: {
      summary:
        "Campaign website build + infrastructure. This node includes site code, scope, agreements, and internal comms.",
      liveSiteUrl: "https://woodallnc.base44.app/",
      notes: "Needs WinRed + campaign email setup. Track scope strictly.",
    },
    websiteCode: {
      mode: "DRAFT",
      codeOrEmbed:
        "// Paste your Base44 code or link/embed here.\n// Example:\n// <iframe src='https://...' />\n\nexport default function CampaignSite() {\n  return <div>...</div>\n}\n",
    },
    scopeOfWork: {
      scopeText:
        "IN SCOPE:\n- Campaign landing site updates\n- Basic content + layout adjustments\n- Form/inquiry routing\n\nOUT OF SCOPE:\n- Ongoing daily content management\n- Paid ad ops\n- Complex custom backend integrations beyond agreed items\n\nDEPENDENCIES:\n- Client provides WinRed access + email setup details\n\nREVISIONS:\n- Up to 2 rounds included\n",
      updatedAt: Date.now() - 1000 * 60 * 25,
      updatedBy: owner.id,
    },
  };

  const access = [
    { nodeId: sethNode.id, userId: assistant.id, permission: "EDIT" }, // invite assistant to Seth node
  ];

  const agreements = [
    {
      id: uid(),
      nodeId: sethNode.id,
      type: "SERVICE_AGREEMENT",
      title: "Service Agreement — Seth Campaign Site",
      url: "",
      signed: false,
      updatedAt: Date.now() - 1000 * 60 * 30,
    },
  ];

  const chat = [
    {
      id: uid(),
      nodeId: sethNode.id,
      userId: owner.id,
      message:
        "Reminder: scope must say **Scope of Work** (not Statement of Work). WinRed + email are prerequisites.",
      createdAt: Date.now() - 1000 * 60 * 18,
    },
  ];

  const activity = [
    {
      id: uid(),
      nodeId: sethNode.id,
      userId: owner.id,
      action: "Created node",
      createdAt: sethNode.createdAt,
    },
    {
      id: uid(),
      nodeId: sethNode.id,
      userId: owner.id,
      action: "Updated Scope of Work",
      createdAt: sethNode.scopeOfWork.updatedAt,
    },
  ];

  return {
    users: [owner, assistant],
    nodes: [sethNode],
    access,
    agreements,
    chat,
    activity,
    currentUserId: owner.id,
  };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return seedDB();
    const parsed = JSON.parse(raw);
    if (!parsed?.users?.length || !parsed?.nodes?.length) return seedDB();
    return parsed;
  } catch {
    return seedDB();
  }
}

function saveDB(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

function getUser(db, userId) {
  return db.users.find((u) => u.id === userId);
}

function getNodePermission(db, nodeId, userId) {
  const user = getUser(db, userId);
  if (!user || user.status !== "ACTIVE") return undefined;
  if (user.role === "OWNER") return "EDIT";
  const access = db.access.find((a) => a.nodeId === nodeId && a.userId === userId);
  return access?.permission;
}

function canView(db, nodeId, userId) {
  return permissionRank(getNodePermission(db, nodeId, userId)) >= 1;
}
function canEdit(db, nodeId, userId) {
  return permissionRank(getNodePermission(db, nodeId, userId)) >= 2;
}

function visibleNodes(db, userId) {
  const user = getUser(db, userId);
  if (!user || user.status !== "ACTIVE") return [];
  if (user.role === "OWNER") return db.nodes;
  const allowed = new Set(db.access.filter((a) => a.userId === userId).map((a) => a.nodeId));
  return db.nodes.filter((n) => allowed.has(n.id));
}

function upsertActivity(db, nodeId, userId, action) {
  const item = { id: uid(), nodeId, userId, action, createdAt: Date.now() };
  return { ...db, activity: [item, ...db.activity] };
}

function PanelCloseButton({
  onClick,
  label = "Close",
}) {
  // Boxed, consistent, mobile safe (no overlay clipping)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:scale-[0.99] dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
    >
      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[12px] leading-none dark:border-gray-800 dark:bg-gray-900">
        <X className="w-3 h-3" />
      </span>
      {label}
    </button>
  );
}

function Badge({ text, status }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
      <span className={`h-2 w-2 rounded-full ${statusDotClass(status)}`} />
      {text}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function MasterHubDashboard() {
  const [db, setDb] = useState(() => (typeof window === "undefined" ? seedDB() : seedDB()));
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [activeTab, setActiveTab] = useState("OVERVIEW");

  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [saveState, setSaveState] = useState("IDLE");

  // Draft edits (per-node) live here to enable dirty tracking before committing
  const [draft, setDraft] = useState(null);

  const dirtyRef = useRef(false);
  const autosaveTimer = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loaded = loadDB();
    setDb(loaded);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    saveDB(db);
  }, [db]);

  const currentUser = useMemo(() => getUser(db, db.currentUserId), [db]);
  const nodes = useMemo(() => visibleNodes(db, db.currentUserId), [db]);

  const selectedNode = useMemo(
    () => (selectedNodeId ? db.nodes.find((n) => n.id === selectedNodeId) : null),
    [db.nodes, selectedNodeId]
  );

  const selectedPermission = useMemo(() => {
    if (!selectedNodeId) return undefined;
    return getNodePermission(db, selectedNodeId, db.currentUserId);
  }, [db, selectedNodeId]);

  const editable = !!selectedNodeId && canEdit(db, selectedNodeId, db.currentUserId);

  // When opening a node, load drafts from node
  useEffect(() => {
    if (!selectedNode) {
      setDraft(null);
      setSaveState("IDLE");
      dirtyRef.current = false;
      return;
    }
    setActiveTab("OVERVIEW");
    setDraft({
      overviewSummary: selectedNode.overview.summary,
      overviewLiveSiteUrl: selectedNode.overview.liveSiteUrl || "",
      overviewNotes: selectedNode.overview.notes,
      codeMode: selectedNode.websiteCode.mode,
      codeOrEmbed: selectedNode.websiteCode.codeOrEmbed,
      scopeText: selectedNode.scopeOfWork.scopeText,
    });
    setSaveState("IDLE");
    dirtyRef.current = false;
  }, [selectedNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const markDirty = () => {
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      setSaveState("DIRTY");
    }
  };

  const commitSave = async (reason = "MANUAL") => {
    if (!selectedNode || !draft) return;
    if (!editable) return;
    if (!dirtyRef.current) return;

    setSaveState("SAVING");

    // Simulate async save (Base44 would be DB update)
    await new Promise((r) => setTimeout(r, 350));

    setDb((prev) => {
      const now = Date.now();
      const nextNodes = prev.nodes.map((n) => {
        if (n.id !== selectedNode.id) return n;
        return {
          ...n,
          updatedAt: now,
          overview: {
            summary: draft.overviewSummary,
            liveSiteUrl: draft.overviewLiveSiteUrl.trim() || undefined,
            notes: draft.overviewNotes,
          },
          websiteCode: { mode: draft.codeMode, codeOrEmbed: draft.codeOrEmbed },
          scopeOfWork: {
            scopeText: draft.scopeText,
            updatedAt: now,
            updatedBy: prev.currentUserId,
          },
        };
      });

      let updated = { ...prev, nodes: nextNodes };

      updated = upsertActivity(
        updated,
        selectedNode.id,
        prev.currentUserId,
        reason === "AUTO" ? "Auto-saved changes" : "Saved changes"
      );

      return updated;
    });

    dirtyRef.current = false;
    setSaveState("SAVED");
    // back to idle after a beat
    setTimeout(() => {
      setSaveState((s) => (s === "SAVED" ? "IDLE" : s));
    }, 800);
  };

  // Autosave
  useEffect(() => {
    if (!autosaveEnabled) return;
    if (!selectedNodeId) return;
    if (!editable) return;

    if (autosaveTimer.current) window.clearInterval(autosaveTimer.current);

    autosaveTimer.current = window.setInterval(() => {
      if (dirtyRef.current) commitSave("AUTO");
    }, 5000);

    return () => {
      if (autosaveTimer.current) window.clearInterval(autosaveTimer.current);
      autosaveTimer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosaveEnabled, selectedNodeId, editable]);

  const switchUser = (userId) => {
    setSelectedNodeId(null);
    setDb((prev) => ({ ...prev, currentUserId: userId }));
  };

  const sendChat = (msg) => {
    if (!selectedNodeId) return;
    if (!canView(db, selectedNodeId, db.currentUserId)) return;
    const trimmed = msg.trim();
    if (!trimmed) return;

    setDb((prev) => {
      const message = {
        id: uid(),
        nodeId: selectedNodeId,
        userId: prev.currentUserId,
        message: trimmed,
        createdAt: Date.now(),
      };
      let updated = { ...prev, chat: [...prev.chat, message] };
      updated = upsertActivity(updated, selectedNodeId, prev.currentUserId, "Sent a chat message");
      return updated;
    });
  };

  const addAgreement = () => {
    if (!selectedNodeId) return;
    if (!editable) return;

    setDb((prev) => {
      const now = Date.now();
      const a = {
        id: uid(),
        nodeId: selectedNodeId,
        type: "OTHER",
        title: "New Agreement",
        url: "",
        signed: false,
        updatedAt: now,
      };
      let updated = { ...prev, agreements: [a, ...prev.agreements] };
      updated = upsertActivity(updated, selectedNodeId, prev.currentUserId, "Added agreement");
      return updated;
    });
  };

  const updateAgreement = (agreementId, patch) => {
    if (!editable) return;
    setDb((prev) => {
      const now = Date.now();
      const next = prev.agreements.map((a) =>
        a.id === agreementId ? { ...a, ...patch, updatedAt: now } : a
      );
      let updated = { ...prev, agreements: next };
      const target = prev.agreements.find((a) => a.id === agreementId);
      if (target?.nodeId) {
        updated = upsertActivity(updated, target.nodeId, prev.currentUserId, "Updated agreement");
      }
      return updated;
    });
  };

  const inviteAssistantToNode = (nodeId, userId, perm) => {
    if (!currentUser || currentUser.role !== "OWNER") return;
    setDb((prev) => {
      const exists = prev.access.find((a) => a.nodeId === nodeId && a.userId === userId);
      let updated = prev;
      if (exists) {
        updated = {
          ...prev,
          access: prev.access.map((a) =>
            a.nodeId === nodeId && a.userId === userId ? { ...a, permission: perm } : a
          ),
        };
      } else {
        updated = { ...prev, access: [...prev.access, { nodeId, userId, permission: perm }] };
      }
      updated = upsertActivity(updated, nodeId, prev.currentUserId, `Updated access for ${userId}`);
      return updated;
    });
  };

  const removeAssistantFromNode = (nodeId, userId) => {
    if (!currentUser || currentUser.role !== "OWNER") return;
    setDb((prev) => {
      let updated = { ...prev, access: prev.access.filter((a) => !(a.nodeId === nodeId && a.userId === userId)) };
      updated = upsertActivity(updated, nodeId, prev.currentUserId, `Removed access for ${userId}`);
      return updated;
    });
  };

  // UI helpers
  const NodeModal = ({ children }) => (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedNodeId(null)} />
      {/* Mobile-safe container: drawer on small screens, centered modal on md+ */}
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-hidden rounded-t-3xl border border-gray-200 bg-white shadow-2xl md:inset-y-10 md:mx-auto md:max-w-5xl md:rounded-3xl dark:border-gray-800 dark:bg-gray-950">
        {/* IMPORTANT: header is sticky; close button is inside header, not absolute overlay */}
        {children}
      </div>
    </div>
  );

  const nodeChat = selectedNodeId
    ? db.chat
        .filter((m) => m.nodeId === selectedNodeId)
        .sort((a, b) => a.createdAt - b.createdAt)
    : [];

  const nodeAgreements = selectedNodeId
    ? db.agreements.filter((a) => a.nodeId === selectedNodeId).sort((a, b) => b.updatedAt - a.updatedAt)
    : [];

  const nodeActivity = selectedNodeId
    ? db.activity.filter((a) => a.nodeId === selectedNodeId).sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const assistants = db.users.filter((u) => u.role === "ASSISTANT" && u.status === "ACTIVE");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-black dark:text-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Top Bar */}
        <div className="mb-6">
          <button 
            onClick={() => window.location.href = createPageUrl('Hub')}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            ← Back to Main Hub
          </button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Master Hub</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Business Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
              Nodes contain everything per project: code, Scope of Work, agreements, chat, and activity history.
            </p>
          </div>

          {/* User Switcher (for testing owner vs assistant) */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Signed in</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-medium">{currentUser?.name ?? "Unknown"}</span>
                <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 dark:border-gray-800 dark:text-gray-300">
                  {currentUser?.role ?? "—"}
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Switch user</label>
              <select
                value={db.currentUserId}
                onChange={(e) => switchUser(e.target.value)}
                className="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
              >
                {db.users
                  .filter((u) => u.status === "ACTIVE")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Nodes Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelectedNodeId(n.id)}
              className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Node</div>
                  <div className="mt-1 text-lg font-semibold">{n.projectName}</div>
                  <div className="mt-2">
                    <Badge text={statusLabel(n.status)} status={n.status} />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  Updated
                  <div className="mt-1 font-semibold">{fmtDateTime(n.updatedAt)}</div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600 line-clamp-3 dark:text-gray-300">
                {n.overview.summary}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Permission:{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {getNodePermission(db, n.id, db.currentUserId) ?? "—"}
                  </span>
                </span>
                <span className="font-semibold opacity-0 transition group-hover:opacity-100">Open →</span>
              </div>
            </button>
          ))}
        </div>

        {/* Owner Controls: quick invite panel */}
        {currentUser?.role === "OWNER" && (
          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">Owner Controls</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Invite assistants to specific nodes with view/edit access.
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Tip: assistants should never see nodes unless invited.
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Assistants</div>
                <div className="mt-2 space-y-2">
                  {assistants.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{a.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{a.email}</span>
                    </div>
                  ))}
                  {assistants.length === 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">No assistants found.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900 md:col-span-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Access Map</div>
                <div className="mt-2 space-y-3">
                  {db.nodes.map((n) => (
                    <div key={n.id} className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold">{n.projectName}</div>
                        <div className="flex items-center gap-2">
                          {assistants.map((a) => {
                            const existing = db.access.find((x) => x.nodeId === n.id && x.userId === a.id);
                            return (
                              <div key={a.id} className="flex items-center gap-2">
                                <select
                                  value={existing?.permission ?? "NONE"}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === "NONE") removeAssistantFromNode(n.id, a.id);
                                    else inviteAssistantToNode(n.id, a.id, v);
                                  }}
                                  className="rounded-xl border border-gray-200 bg-white px-2 py-1 text-xs shadow-sm outline-none focus:ring-2 focus:ring-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
                                >
                                  <option value="NONE">No access</option>
                                  <option value="VIEW">View</option>
                                  <option value="EDIT">Edit</option>
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Current access:{" "}
                        {db.access
                          .filter((a) => a.nodeId === n.id)
                          .map((a) => `${getUser(db, a.userId)?.name ?? a.userId}(${a.permission})`)
                          .join(", ") || "None"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Node Modal */}
        {selectedNode && draft && (
          <NodeModal>
            {/* Header (sticky, mobile safe) */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur md:px-6 dark:border-gray-800 dark:bg-gray-950/90">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-lg font-semibold">{selectedNode.projectName}</div>
                    <Badge text={statusLabel(selectedNode.status)} status={selectedNode.status} />
                    <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 dark:border-gray-800 dark:text-gray-300">
                      Permission: {selectedPermission ?? "—"}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Updated: {fmtDateTime(selectedNode.updatedAt)}
                  </div>
                </div>

                {/* Right controls: autosave + save + close */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAutosaveEnabled((v) => !v)}
                    className={[
                      "rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition",
                      autosaveEnabled
                        ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900",
                    ].join(" ")}
                  >
                    Autosave: {autosaveEnabled ? "On" : "Off"}
                  </button>

                  <button
                    type="button"
                    disabled={!editable || saveState === "SAVING" || saveState === "IDLE"}
                    onClick={() => commitSave("MANUAL")}
                    className={[
                      "rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition",
                      !editable
                        ? "cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-900 dark:text-gray-500"
                        : saveState === "DIRTY"
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : saveState === "SAVING"
                        ? "bg-yellow-600 text-white"
                        : saveState === "SAVED"
                        ? "bg-emerald-700 text-white"
                        : "bg-gray-200 text-gray-500 dark:bg-gray-900 dark:text-gray-500",
                    ].join(" ")}
                  >
                    {saveState === "DIRTY"
                      ? "Save"
                      : saveState === "SAVING"
                      ? "Saving…"
                      : saveState === "SAVED"
                      ? "Saved"
                      : "Save"}
                  </button>

                  <PanelCloseButton onClick={() => setSelectedNodeId(null)} />
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-4 flex flex-wrap gap-2">
                <TabButton active={activeTab === "OVERVIEW"} onClick={() => setActiveTab("OVERVIEW")}>
                  Overview
                </TabButton>
                <TabButton active={activeTab === "CODE"} onClick={() => setActiveTab("CODE")}>
                  Website Code
                </TabButton>
                <TabButton active={activeTab === "SCOPE"} onClick={() => setActiveTab("SCOPE")}>
                  Scope of Work
                </TabButton>
                <TabButton active={activeTab === "AGREEMENTS"} onClick={() => setActiveTab("AGREEMENTS")}>
                  Agreements
                </TabButton>
                <TabButton active={activeTab === "CHAT"} onClick={() => setActiveTab("CHAT")}>
                  Chat
                </TabButton>
                <TabButton active={activeTab === "ACTIVITY"} onClick={() => setActiveTab("ACTIVITY")}>
                  Activity
                </TabButton>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[calc(92vh-130px)] overflow-y-auto px-4 py-5 md:px-6">
              {/* Overview */}
              {activeTab === "OVERVIEW" && (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Project Summary</div>
                    <textarea
                      value={draft.overviewSummary}
                      disabled={!editable}
                      onChange={(e) => {
                        setDraft((d) => (d ? { ...d, overviewSummary: e.target.value } : d));
                        markDirty();
                      }}
                      className="mt-2 h-28 w-full resize-none rounded-2xl border border-gray-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-70 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Live Site URL</div>
                      <input
                        value={draft.overviewLiveSiteUrl}
                        disabled={!editable}
                        onChange={(e) => {
                          setDraft((d) => (d ? { ...d, overviewLiveSiteUrl: e.target.value } : d));
                          markDirty();
                        }}
                        className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-70 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
                        placeholder="https://…"
                      />
                      {draft.overviewLiveSiteUrl?.trim() ? (
                        <a
                          href={draft.overviewLiveSiteUrl.trim()}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-sm font-semibold text-gray-900 underline underline-offset-4 dark:text-gray-100"
                        >
                          Open live site →
                        </a>
                      ) : null}
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Internal Notes</div>
                      <textarea
                        value={draft.overviewNotes}
                        disabled={!editable}
                        onChange={(e) => {
                          setDraft((d) => (d ? { ...d, overviewNotes: e.target.value } : d));
                          markDirty();
                        }}
                        className="mt-2 h-28 w-full resize-none rounded-2xl border border-gray-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-70 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Code */}
              {activeTab === "CODE" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold">Website Code</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Mode</span>
                      <select
                        value={draft.codeMode}
                        disabled={!editable}
                        onChange={(e) => {
                          setDraft((d) => (d ? { ...d, codeMode: e.target.value } : d));
                          markDirty();
                        }}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-70 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
                      >
                        <option value="LIVE">Live</option>
                        <option value="DRAFT">Draft</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Paste code or embed here (Base44 project embed works too)
                    </div>
                    <textarea
                      value={draft.codeOrEmbed}
                      disabled={!editable}
                      onChange={(e) => {
                        setDraft((d) => (d ? { ...d, codeOrEmbed: e.target.value } : d));
                        markDirty();
                      }}
                      className="mt-2 h-80 w-full resize-none rounded-2xl border border-gray-200 bg-white p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-70 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
                    />
                  </div>
                </div>
              )}

              {/* Scope of Work */}
              {activeTab === "SCOPE" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold">Scope of Work</div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        This replaces “Statement of Work” and is your liability shield. Keep it strict.
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last update: {fmtDateTime(selectedNode.scopeOfWork.updatedAt)}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <textarea
                      value={draft.scopeText}
                      disabled={!editable}
                      onChange={(e) => {
                        setDraft((d) => (d ? { ...d, scopeText: e.target.value } : d));
                        markDirty();
                      }}
                      className="mt-1 h-[420px] w-full resize-none rounded-2xl border border-gray-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-70 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
                    />
                    {!editable && (
                      <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                        You have <b>view-only</b> access to this node.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Agreements */}
              {activeTab === "AGREEMENTS" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">Agreements</div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Store service agreement + addendums per node.
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!editable}
                      onClick={addAgreement}
                      className={[
                        "rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition",
                        editable
                          ? "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                          : "cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-900 dark:text-gray-500",
                      ].join(" ")}
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-3">
                    {nodeAgreements.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-2">
                            <select
                              value={a.type}
                              disabled={!editable}
                              onChange={(e) => updateAgreement(a.id, { type: e.target.value })}
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-70 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
                            >
                              <option value="SERVICE_AGREEMENT">Service Agreement</option>
                              <option value="SCOPE_ADDENDUM">Scope Addendum</option>
                              <option value="OTHER">Other</option>
                            </select>

                            <label className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={a.signed}
                                disabled={!editable}
                                onChange={(e) => updateAgreement(a.id, { signed: e.target.checked })}
                              />
                              Signed
                            </label>
                          </div>

                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Updated: {fmtDateTime(a.updatedAt)}
                          </div>
                        </div>

                        <input
                          value={a.title}
                          disabled={!editable}
                          onChange={(e) => updateAgreement(a.id, { title: e.target.value })}
                          className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-70 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
                          placeholder="Agreement title"
                        />

                        <input
                          value={a.url ?? ""}
                          disabled={!editable}
                          onChange={(e) => updateAgreement(a.id, { url: e.target.value })}
                          className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-70 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
                          placeholder="File URL (optional)"
                        />

                        {a.url?.trim() ? (
                          <a
                            href={a.url.trim()}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-sm font-semibold text-gray-900 underline underline-offset-4 dark:text-gray-100"
                          >
                            Open file →
                          </a>
                        ) : null}
                      </div>
                    ))}

                    {nodeAgreements.length === 0 && (
                      <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                        No agreements yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chat */}
              {activeTab === "CHAT" && (
                <ChatPanel
                  editable={canView(db, selectedNodeId, db.currentUserId)}
                  messages={nodeChat}
                  users={db.users}
                  onSend={sendChat}
                />
              )}

              {/* Activity */}
              {activeTab === "ACTIVITY" && (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold">Activity</div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Automatic history of changes and actions inside this node.
                    </div>
                  </div>

                  <div className="space-y-2">
                    {nodeActivity.map((a) => {
                      const u = getUser(db, a.userId);
                      return (
                        <div
                          key={a.id}
                          className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-950"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-medium">
                              {u?.name ?? a.userId}: <span className="font-semibold">{a.action}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{fmtDateTime(a.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })}
                    {nodeActivity.length === 0 && (
                      <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                        No activity yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer hint bar */}
            <div className="border-t border-gray-200 bg-white px-4 py-3 text-xs text-gray-500 md:px-6 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
              {editable ? (
                <span>
                  Changes are tracked. {autosaveEnabled ? "Autosave is on." : "Autosave is off."} Use <b>Save</b> to
                  commit edits.
                </span>
              ) : (
                <span>View-only access. Ask the owner to grant edit permission if needed.</span>
              )}
            </div>
          </NodeModal>
        )}
      </div>
    </div>
  );
}

function ChatPanel({
  editable,
  messages,
  users,
  onSend,
}) {
  const [msg, setMsg] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    // auto-scroll to bottom on new messages
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const send = () => {
    if (!editable) return;
    onSend(msg);
    setMsg("");
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold">Node Chat</div>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Messages stay inside this project node for clean collaboration.
        </div>
      </div>

      <div
        ref={listRef}
        className="h-[420px] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950"
      >
        {messages.length === 0 ? (
          <div className="text-sm text-gray-600 dark:text-gray-300">No messages yet.</div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const u = users.find((x) => x.id === m.userId);
              return (
                <div key={m.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{u?.name ?? m.userId}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-gray-800 dark:text-gray-100">{m.message}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">New message</div>
        <textarea
          value={msg}
          disabled={!editable}
          onChange={(e) => setMsg(e.target.value)}
          className="mt-2 h-28 w-full resize-none rounded-2xl border border-gray-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-70 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-gray-700"
          placeholder={editable ? "Type a message…" : "You don’t have access to post here."}
        />
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {editable ? "Press Send to post inside this node." : "View-only."}
          </div>
          <button
            type="button"
            disabled={!editable || !msg.trim()}
            onClick={send}
            className={[
              "rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition",
              editable && msg.trim()
                ? "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                : "cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-900 dark:text-gray-500",
            ].join(" ")}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}