"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Trash2,
  ChevronRight,
  Users,
  Loader2,
  KeyRound,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import {
  PageLoading,
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ConfirmModal,
  Drawer,
  Badge,
} from "@heritage-dx/ui";
import { useAdminRepositories } from "@heritage-dx/api";
import { useAuth } from "@/contexts/AuthContext";
import { AdminUser, UserRole } from "@/types";

const DEFAULT_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000001";

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "최고 관리자",
  ORG_ADMIN: "관리자",
  EDITOR: "편집자",
};

const roleBadgeVariant: Record<
  UserRole,
  "default" | "success" | "info" | "warning"
> = {
  SUPER_ADMIN: "default",
  ORG_ADMIN: "info",
  EDITOR: "warning",
};

function getRoleOptions(currentUserRole: UserRole) {
  if (currentUserRole === "SUPER_ADMIN") {
    return [
      { value: "EDITOR", label: "편집자" },
      { value: "ORG_ADMIN", label: "관리자" },
      { value: "SUPER_ADMIN", label: "최고 관리자" },
    ];
  }
  // ORG_ADMIN은 EDITOR만 생성 가능
  return [{ value: "EDITOR", label: "편집자" }];
}

export default function UsersPage() {
  const { users: usersAdmin } = useAdminRepositories();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Drawer 상태
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // 추가 폼 상태
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("EDITOR");
  const [isSaving, setIsSaving] = useState(false);

  // 수정 폼 상태
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("EDITOR");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // 삭제 상태
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 비밀번호 초기화 상태
  const [resetPasswordTarget, setResetPasswordTarget] =
    useState<AdminUser | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredUsers(
        users.filter(
          (u) =>
            (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  useEffect(() => {
    if (selectedUser) {
      setEditName(selectedUser.name || "");
      setEditRole(selectedUser.role);
      setEditIsActive(selectedUser.isActive !== false);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await usersAdmin.getAll({ limit: 100 });
      if (response.success && response.data) {
        setUsers(response.data.users || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
    }
    setIsLoading(false);
  };

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
      const response = await usersAdmin.create({
        email: newEmail,
        name: newName,
        role: newRole,
        organizationId: currentUser?.organizationId || DEFAULT_ORGANIZATION_ID,
      });
      console.log("create response", {
        email: newEmail,
        name: newName,
        role: newRole,
        organizationId: currentUser?.organizationId || DEFAULT_ORGANIZATION_ID,
      });
      if (response.success) {
        alert("사용자가 등록되었습니다. 임시 비밀번호가 이메일로 발송됩니다.");
        setShowAddDrawer(false);
        resetAddForm();
        loadUsers();
      } else {
        alert(response.error || "사용자 등록에 실패했습니다.");
      }
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
      const response = await usersAdmin.update(selectedUser.id, {
        name: editName,
        role: editRole,
        isActive: editIsActive,
      });
      if (response.success) {
        alert("사용자 정보가 수정되었습니다.");
        loadUsers();
        setSelectedUser({
          ...selectedUser,
          name: editName,
          role: editRole,
          isActive: editIsActive,
        });
      } else {
        alert(response.error || "사용자 수정에 실패했습니다.");
      }
    } catch {
      alert("사용자 수정 중 오류가 발생했습니다.");
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    try {
      const response = await usersAdmin.delete(deleteTarget.id);
      if (response.success) {
        setUsers(users.filter((u) => u.id !== deleteTarget.id));
        if (selectedUser?.id === deleteTarget.id) {
          setSelectedUser(null);
        }
      } else {
        alert(response.error || "삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordTarget?.id) return;
    setIsResettingPassword(true);
    try {
      const response = await usersAdmin.resetPassword(resetPasswordTarget.id);
      if (response.success) {
        alert(
          "비밀번호가 초기화되었습니다. 임시 비밀번호가 이메일로 발송됩니다.",
        );
      } else {
        alert(response.error || "비밀번호 초기화에 실패했습니다.");
      }
    } catch {
      alert("비밀번호 초기화 중 오류가 발생했습니다.");
    }
    setIsResettingPassword(false);
    setResetPasswordTarget(null);
  };

  const resetAddForm = () => {
    setNewEmail("");
    setNewName("");
    setNewRole("EDITOR");
  };

  // 권한 체크: EDITOR는 접근 불가
  if (currentUser && currentUser.role === "EDITOR") {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">권한이 없습니다</p>
            <p className="text-gray-400 text-sm mt-1">
              사용자 관리는 관리자 이상만 접근할 수 있습니다.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return <PageLoading />;
  }

  const roleOptions = currentUser ? getRoleOptions(currentUser.role) : [];

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
            <p className="text-sm text-gray-500">
              시스템 사용자 계정을 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* 메인 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>사용자 목록</CardTitle>
              <Badge variant="default">{users.length}명</Badge>
            </div>
            <Button size="sm" onClick={() => setShowAddDrawer(true)}>
              <Plus className="w-4 h-4 mr-1" />새 사용자
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 검색 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="이름 또는 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 사용자 목록 */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">
                  {searchTerm
                    ? "검색 결과가 없습니다"
                    : "등록된 사용자가 없습니다"}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddDrawer(true)}
                    className="text-primary hover:underline text-sm"
                  >
                    새 사용자 등록하기
                  </button>
                )}
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {(u.name || "?").charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {u.name}
                        </span>
                        <Badge variant={roleBadgeVariant[u.role]}>
                          {roleLabels[u.role] || u.role}
                        </Badge>
                        {u.isActive === false && (
                          <Badge variant="error">비활성</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(u);
                      }}
                      className="p-2 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-error" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 사용자 추가 Drawer */}
      <Drawer
        isOpen={showAddDrawer}
        onClose={() => {
          setShowAddDrawer(false);
          resetAddForm();
        }}
        title="새 사용자 등록"
        width="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  사용자 계정 생성
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  등록된 이메일로 임시 비밀번호가 발송됩니다. 첫 로그인 시
                  비밀번호를 변경해야 합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="홍길동"
              />
            </div>

            <Select
              label="역할"
              required
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              options={roleOptions}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDrawer(false);
                resetAddForm();
              }}
            >
              취소
            </Button>
            <Button onClick={handleAddUser} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  등록 중...
                </>
              ) : (
                "등록"
              )}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 사용자 상세/수정 Drawer */}
      <Drawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="사용자 상세"
        width="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* 기본 정보 (읽기 전용) */}
            <Card>
              <CardHeader>
                <CardTitle>계정 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">이메일</span>
                    <p className="font-medium text-gray-900">
                      {selectedUser.email}
                    </p>
                  </div>
                  {selectedUser.createdAt && (
                    <div>
                      <span className="text-sm text-gray-500">생성일</span>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedUser.createdAt).toLocaleDateString(
                          "ko-KR",
                        )}
                      </p>
                    </div>
                  )}
                  {selectedUser.lastLoginAt && (
                    <div>
                      <span className="text-sm text-gray-500">
                        마지막 로그인
                      </span>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedUser.lastLoginAt).toLocaleDateString(
                          "ko-KR",
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 수정 가능 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>사용자 정보 수정</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="이름을 입력하세요"
                    />
                  </div>

                  <Select
                    label="역할"
                    required
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    options={roleOptions}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상태
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditIsActive(!editIsActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          editIsActive ? "bg-primary" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            editIsActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-sm text-gray-700">
                        {editIsActive ? "활성" : "비활성"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleUpdateUser} disabled={isEditing}>
                      {isEditing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        "저장"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 하단 버튼 */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(selectedUser)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  삭제
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setResetPasswordTarget(selectedUser)}
                >
                  <KeyRound className="w-4 h-4 mr-1" />
                  비밀번호 초기화
                </Button>
              </div>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                닫기
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* 삭제 확인 모달 */}
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

      {/* 비밀번호 초기화 확인 모달 */}
      <ConfirmModal
        isOpen={!!resetPasswordTarget}
        onClose={() => setResetPasswordTarget(null)}
        onConfirm={handleResetPassword}
        title="비밀번호 초기화"
        message={`"${resetPasswordTarget?.name}" 사용자의 비밀번호를 초기화하시겠습니까? 임시 비밀번호가 이메일로 발송됩니다.`}
        confirmText="초기화"
        variant="primary"
        isLoading={isResettingPassword}
      />
    </PageContainer>
  );
}
