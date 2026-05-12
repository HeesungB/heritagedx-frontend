"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { ConfirmModal } from "@heritage-dx/ui";
import {
  ROLE_LABELS,
  canAccessUsersPage,
  getAssignableRoles,
  useUserMutations,
  useUsers,
} from "@heritage-dx/store";
import type { AdminUserEntity as AdminUser, UserRole } from "@heritage-dx/store";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE = 7;
const DEFAULT_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000001";

const ROLE_PILL_STYLE: Record<UserRole, CSSProperties> = {
  EDITOR: {
    backgroundColor: "#F0EEF8",
    color: "#4D3FAA",
    border: "1px solid #E2DEF1",
  },
  ORG_ADMIN: {
    backgroundColor: "#F5F5F4",
    color: "#2D2D2D",
    border: "1px solid #DCDCD8",
  },
  SUPER_ADMIN: {
    backgroundColor: "#0A0A0A",
    color: "#FFFFFF",
    border: "1px solid #0A0A0A",
  },
};

function formatRelative(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${dd}`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR");
}

function useModalShell(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);
}

export default function UsersPage() {
  const { data: users, isLoading, refetch: loadUsers } = useUsers({ limit: 100 });
  const {
    create: createUser,
    update: updateUser,
    remove: deleteUser,
    resetPassword: resetUserPassword,
  } = useUserMutations();
  const { user: currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("EDITOR");
  const [isSaving, setIsSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("EDITOR");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q),
    );
  }, [searchTerm, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [filteredUsers, currentPage],
  );
  const rangeStart =
    filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.name || "");
      setEditRole(selectedUser.role);
      setEditIsActive(selectedUser.isActive !== false);
    }
  }, [selectedUser]);

  const roleOptions = currentUser ? getAssignableRoles(currentUser.role) : [];

  const closeAddModal = useCallback(() => {
    setIsAddOpen(false);
    setNewEmail("");
    setNewName("");
    setNewRole("EDITOR");
  }, []);

  const closeDetailModal = useCallback(() => {
    setSelectedUser(null);
  }, []);

  const handleAddUser = async () => {
    if (!newEmail.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }
    if (!newName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    setIsSaving(true);
    try {
      await createUser({
        email: newEmail.trim(),
        name: newName.trim(),
        role: newRole,
        organizationId: currentUser?.organizationId || DEFAULT_ORGANIZATION_ID,
      });
      alert("사용자가 등록되었습니다. 임시 비밀번호가 이메일로 발송됩니다.");
      closeAddModal();
      loadUsers();
    } catch {
      alert("사용자 등록 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser?.id) return;
    if (!editName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    setIsEditing(true);
    try {
      await updateUser(selectedUser.id, {
        name: editName.trim(),
        role: editRole,
        isActive: editIsActive,
      });
      alert("사용자 정보가 수정되었습니다.");
      loadUsers();
      setSelectedUser({
        ...selectedUser,
        name: editName.trim(),
        role: editRole,
        isActive: editIsActive,
      });
    } catch {
      alert("사용자 수정 중 오류가 발생했습니다.");
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      if (selectedUser?.id === deleteTarget.id) {
        setSelectedUser(null);
      }
      loadUsers();
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleResetPassword = async () => {
    if (!resetTarget?.id) return;
    setIsResetting(true);
    try {
      await resetUserPassword(resetTarget.id);
      alert("비밀번호가 초기화되었습니다. 임시 비밀번호가 이메일로 발송됩니다.");
    } catch {
      alert("비밀번호 초기화 중 오류가 발생했습니다.");
    }
    setIsResetting(false);
    setResetTarget(null);
  };

  if (currentUser && !canAccessUsersPage(currentUser)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-700">권한이 없습니다</p>
          <p className="text-xs text-neutral-400 mt-1">
            사용자 관리는 관리자 이상만 접근할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="px-10 pt-10 pb-14 overflow-y-auto">
      <div className="max-w-[920px] mx-auto">
        {/* Page header */}
        <div className="flex justify-between items-start gap-6 mb-7">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-neutral-50 grid place-items-center text-neutral-900 flex-shrink-0">
              <Users className="w-[18px] h-[18px]" strokeWidth={1.6} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10.5px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
                User Management
              </span>
              <h1 className="text-2xl font-bold tracking-[-0.025em] leading-[1.2] text-neutral-900 m-0">
                사용자 관리
              </h1>
              <span className="text-[12.5px] text-neutral-500 mt-0.5 tracking-[-0.005em]">
                시스템 사용자 계정을 관리합니다
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 pt-1.5">
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white bg-neutral-900 border border-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors tracking-[-0.005em]"
            >
              <Plus className="w-[13px] h-[13px]" strokeWidth={2} />
              <span>새 사용자</span>
            </button>
          </div>
        </div>

        {/* Panel */}
        <div className="border border-neutral-100 rounded-card bg-surface overflow-hidden">
          {/* panel head */}
          <div className="px-6 pt-[18px] pb-[14px] border-b border-neutral-100 flex items-baseline justify-between gap-4">
            <h2 className="text-[13.5px] font-semibold text-neutral-900 tracking-[-0.01em] m-0 inline-flex items-baseline gap-2.5">
              사용자 목록
              <span className="text-[11px] font-semibold px-1.5 py-px rounded bg-neutral-50 text-neutral-600 border border-neutral-200 font-mono">
                {users.length}
              </span>
            </h2>
            <span className="text-[11.5px] text-neutral-400 font-mono tracking-[0.02em]">
              all roles · active
            </span>
          </div>

          {/* search */}
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/60">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none"
                strokeWidth={1.7}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름 또는 이메일로 검색…"
                className="w-full h-[38px] pl-9 pr-3 text-[13px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/10 transition-colors"
              />
            </div>
          </div>

          {/* list */}
          {filteredUsers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-neutral-50 grid place-items-center mb-3">
                <Users className="w-5 h-5 text-neutral-400" />
              </div>
              <p className="text-sm font-medium text-neutral-700">
                {searchTerm ? "검색 결과가 없습니다" : "등록된 사용자가 없습니다"}
              </p>
              {!searchTerm && (
                <button
                  type="button"
                  onClick={() => setIsAddOpen(true)}
                  className="mt-2 text-[12.5px] text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
                >
                  새 사용자 등록하기
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {pagedUsers.map((u, idx) => {
                const indexNumber =
                  (currentPage - 1) * PAGE_SIZE + idx + 1;
                const indexLabel = String(indexNumber).padStart(2, "0");
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    className={`group relative grid grid-cols-[40px_1fr_120px_130px_24px] items-center gap-5 px-6 py-4 text-left transition-colors hover:bg-neutral-50/60 ${
                      idx === 0 ? "" : "border-t border-neutral-50"
                    }`}
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-neutral-900 transition-colors" />
                    <span className="text-[11px] font-medium text-neutral-400 font-mono tracking-[0.04em]">
                      {indexLabel}
                    </span>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[15px] font-semibold text-neutral-900 tracking-[-0.015em] truncate">
                        {u.name || "이름 없음"}
                      </span>
                      <span className="text-[12.5px] text-neutral-500 font-mono leading-[1.4] truncate">
                        {u.email}
                      </span>
                    </div>
                    <span
                      className="justify-self-start inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded leading-[1.5] whitespace-nowrap"
                      style={ROLE_PILL_STYLE[u.role]}
                    >
                      {ROLE_LABELS[u.role]}
                    </span>
                    <div className="flex flex-col gap-[3px] text-right">
                      <span className="text-[10.5px] font-medium text-neutral-400 tracking-[-0.005em]">
                        마지막 로그인
                      </span>
                      <span className="text-[12.5px] font-medium text-neutral-600 tracking-[-0.01em]">
                        {formatRelative(u.lastLoginAt)}
                      </span>
                    </div>
                    <span className="grid place-items-center text-neutral-300 group-hover:text-neutral-900 transition-transform group-hover:translate-x-0.5">
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* panel foot */}
          <div className="px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/60 flex items-center justify-between">
            <span className="text-[11.5px] text-neutral-400 font-mono tracking-[0.02em]">
              Showing {rangeStart}–{rangeEnd} of {filteredUsers.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="이전"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-[26px] h-[26px] grid place-items-center rounded-md border border-neutral-200 bg-surface text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3 h-3" strokeWidth={1.8} />
              </button>
              <span className="px-1.5 text-[11.5px] text-neutral-600 font-mono tracking-[0.02em]">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                aria-label="다음"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-[26px] h-[26px] grid place-items-center rounded-md border border-neutral-200 bg-surface text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3 h-3" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New User Modal */}
      <NewUserModal
        isOpen={isAddOpen}
        onClose={closeAddModal}
        email={newEmail}
        name={newName}
        role={newRole}
        onEmailChange={setNewEmail}
        onNameChange={setNewName}
        onRoleChange={setNewRole}
        roleOptions={roleOptions}
        isSaving={isSaving}
        onSubmit={handleAddUser}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        onClose={closeDetailModal}
        editName={editName}
        editRole={editRole}
        editIsActive={editIsActive}
        onNameChange={setEditName}
        onRoleChange={setEditRole}
        onActiveToggle={() => setEditIsActive((v) => !v)}
        roleOptions={roleOptions}
        isEditing={isEditing}
        onSubmit={handleUpdateUser}
        onDelete={() => selectedUser && setDeleteTarget(selectedUser)}
        onResetPassword={() => selectedUser && setResetTarget(selectedUser)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="사용자 삭제"
        message={`"${deleteTarget?.name}" (${deleteTarget?.email}) 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={handleResetPassword}
        title="비밀번호 초기화"
        message={`"${resetTarget?.name}" 사용자의 비밀번호를 초기화하시겠습니까? 임시 비밀번호가 이메일로 발송됩니다.`}
        confirmText="초기화"
        variant="primary"
        isLoading={isResetting}
      />
    </div>
  );
}

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  maxWidth: number;
  children: ReactNode;
  footer: ReactNode;
}

function ModalShell({
  isOpen,
  onClose,
  title,
  maxWidth,
  children,
  footer,
}: ModalShellProps) {
  useModalShell(isOpen, onClose);
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity"
      style={{ backgroundColor: "rgba(10,10,10,0.42)", backdropFilter: "blur(2px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-labelledby="modal-title"
        className="w-full bg-surface rounded-[14px] flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] max-h-[calc(100vh-48px)]"
        style={{ maxWidth }}
      >
        <div className="px-6 py-[18px] border-b border-neutral-100 flex items-center justify-between flex-shrink-0">
          <h3
            id="modal-title"
            className="text-[15.5px] font-bold text-neutral-900 tracking-[-0.02em] m-0"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-7 h-7 grid place-items-center text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 rounded-md transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer}
      </div>
    </div>
  );
}

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  name: string;
  role: UserRole;
  onEmailChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onRoleChange: (v: UserRole) => void;
  roleOptions: { value: UserRole; label: string }[];
  isSaving: boolean;
  onSubmit: () => void;
}

function NewUserModal({
  isOpen,
  onClose,
  email,
  name,
  role,
  onEmailChange,
  onNameChange,
  onRoleChange,
  roleOptions,
  isSaving,
  onSubmit,
}: NewUserModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="새 사용자 등록"
      maxWidth={480}
      footer={
        <div className="px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/60 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-neutral-600 bg-surface border border-neutral-200 rounded-lg hover:border-neutral-300 hover:text-neutral-900 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white bg-neutral-900 border border-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                등록 중…
              </>
            ) : (
              "등록"
            )}
          </button>
        </div>
      }
    >
      <div
        className="flex gap-3 p-3.5 rounded-[10px] mb-5"
        style={{
          backgroundColor: "#F0EEF8",
          border: "1px solid #E2DEF1",
        }}
      >
        <div
          className="w-7 h-7 rounded-lg grid place-items-center flex-shrink-0"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2DEF1",
            color: "#4D3FAA",
          }}
        >
          <UserPlus className="w-3.5 h-3.5" strokeWidth={1.8} />
        </div>
        <div className="flex flex-col gap-1">
          <span
            className="text-[13px] font-semibold tracking-[-0.01em]"
            style={{ color: "#2D2476" }}
          >
            사용자 계정 생성
          </span>
          <span
            className="text-[12.5px] leading-[1.55] tracking-[-0.005em]"
            style={{ color: "#4D3FAA" }}
          >
            등록된 이메일로 임시 비밀번호가 발송됩니다. 첫 로그인 시 비밀번호를
            변경해야 합니다.
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <FormField label="이메일" required htmlFor="nu-email">
          <input
            id="nu-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="user@example.com"
            className="w-full h-10 px-3 text-[13.5px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none placeholder:text-neutral-300 focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/10 transition-colors"
          />
        </FormField>
        <FormField label="이름" required htmlFor="nu-name">
          <input
            id="nu-name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="홍길동"
            className="w-full h-10 px-3 text-[13.5px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none placeholder:text-neutral-300 focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/10 transition-colors"
          />
        </FormField>
        <FormField label="역할" required htmlFor="nu-role">
          <RoleSelect
            id="nu-role"
            value={role}
            onChange={onRoleChange}
            options={roleOptions}
          />
        </FormField>
      </div>
    </ModalShell>
  );
}

interface UserDetailModalProps {
  user: AdminUser | null;
  onClose: () => void;
  editName: string;
  editRole: UserRole;
  editIsActive: boolean;
  onNameChange: (v: string) => void;
  onRoleChange: (v: UserRole) => void;
  onActiveToggle: () => void;
  roleOptions: { value: UserRole; label: string }[];
  isEditing: boolean;
  onSubmit: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
}

function UserDetailModal({
  user,
  onClose,
  editName,
  editRole,
  editIsActive,
  onNameChange,
  onRoleChange,
  onActiveToggle,
  roleOptions,
  isEditing,
  onSubmit,
  onDelete,
  onResetPassword,
}: UserDetailModalProps) {
  return (
    <ModalShell
      isOpen={!!user}
      onClose={onClose}
      title="사용자 상세"
      maxWidth={560}
      footer={
        <div className="px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/60 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-lg bg-surface transition-colors"
              style={{
                color: "#DC2626",
                border: "1px solid #F4CCCC",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FDF4F4";
                e.currentTarget.style.borderColor = "#E89999";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.borderColor = "#F4CCCC";
              }}
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>삭제</span>
            </button>
            <button
              type="button"
              onClick={onResetPassword}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-neutral-600 bg-surface border border-neutral-200 rounded-lg hover:border-neutral-300 hover:text-neutral-900 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>비밀번호 초기화</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-neutral-600 bg-surface border border-neutral-200 rounded-lg hover:border-neutral-300 hover:text-neutral-900 transition-colors"
          >
            닫기
          </button>
        </div>
      }
    >
      {user && (
        <div className="flex flex-col gap-3.5">
          {/* Account info section */}
          <div className="border border-neutral-100 rounded-[10px] bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/60">
              <h4 className="text-[12.5px] font-bold text-neutral-900 tracking-[-0.01em] m-0">
                계정 정보
              </h4>
            </div>
            <div className="px-4 py-3.5">
              <InfoRow label="이메일">
                <span className="font-mono text-[12.5px] text-neutral-900 font-medium break-all">
                  {user.email}
                </span>
              </InfoRow>
              <InfoRow label="생성일" withDivider>
                <span className="text-[13px] text-neutral-900 font-medium tracking-[-0.01em]">
                  {formatDate(user.createdAt)}
                </span>
              </InfoRow>
              <InfoRow label="마지막 로그인" withDivider>
                <span className="text-[13px] text-neutral-900 font-medium tracking-[-0.01em]">
                  {user.lastLoginAt ? formatDate(user.lastLoginAt) : "-"}
                </span>
              </InfoRow>
            </div>
          </div>

          {/* Edit section */}
          <div className="border border-neutral-100 rounded-[10px] bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/60">
              <h4 className="text-[12.5px] font-bold text-neutral-900 tracking-[-0.01em] m-0">
                사용자 정보 수정
              </h4>
            </div>
            <div className="p-4 flex flex-col gap-3.5">
              <FormField label="이름" required htmlFor="ud-name">
                <input
                  id="ud-name"
                  type="text"
                  value={editName}
                  onChange={(e) => onNameChange(e.target.value)}
                  className="w-full h-10 px-3 text-[13.5px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/10 transition-colors"
                />
              </FormField>
              <FormField label="역할" required htmlFor="ud-role">
                <RoleSelect
                  id="ud-role"
                  value={editRole}
                  onChange={onRoleChange}
                  options={roleOptions}
                />
              </FormField>
              <FormField label="상태">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editIsActive}
                    onClick={onActiveToggle}
                    className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ${
                      editIsActive ? "bg-neutral-900" : "bg-neutral-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-transform ${
                        editIsActive ? "translate-x-[18px]" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-[13px] text-neutral-900 font-medium tracking-[-0.01em]">
                    {editIsActive ? "활성" : "비활성"}
                  </span>
                </div>
              </FormField>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isEditing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white bg-neutral-900 border border-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      저장 중…
                    </>
                  ) : (
                    "저장"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function FormField({
  label,
  required,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[7px]">
      <label
        htmlFor={htmlFor}
        className="text-[12.5px] font-semibold text-neutral-900 tracking-[-0.01em] inline-flex items-center gap-1"
      >
        {label}
        {required && (
          <span className="text-[#DC2626] font-bold">*</span>
        )}
      </label>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  withDivider,
  children,
}: {
  label: string;
  withDivider?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`grid grid-cols-[92px_1fr] gap-3 items-baseline py-1.5 ${
        withDivider ? "border-t border-neutral-50 pt-2.5 mt-1" : ""
      }`}
    >
      <span className="text-[11.5px] font-medium text-neutral-400 tracking-[-0.005em]">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

function RoleSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: UserRole;
  onChange: (v: UserRole) => void;
  options: { value: UserRole; label: string }[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as UserRole)}
      className="w-full h-10 pl-3 pr-9 text-[13.5px] text-neutral-900 bg-surface border border-neutral-200 rounded-lg outline-none focus:border-neutral-900 focus:ring-[3px] focus:ring-neutral-900/10 transition-colors appearance-none cursor-pointer"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
