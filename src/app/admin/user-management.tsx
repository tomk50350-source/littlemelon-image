"use client";

import { useState } from "react";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  emailVerified: string | Date | null;
  createdAt: string | Date;
  balance: number;
};

type UserManagementProps = {
  users: AdminUser[];
};

export function UserManagement({ users }: UserManagementProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    role: "USER",
    emailVerified: true,
    initialCredits: "0"
  });
  const [edits, setEdits] = useState<Record<string, { role: string; emailVerified: boolean; password: string; creditDelta: string; creditNote: string }>>(
    Object.fromEntries(
      users.map((user) => [
        user.id,
        {
          role: user.role,
          emailVerified: Boolean(user.emailVerified),
          password: "",
          creditDelta: "",
          creditNote: ""
        }
      ])
    )
  );

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newUser,
        initialCredits: Number(newUser.initialCredits || 0)
      })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || "新增用户失败");
      return;
    }

    setMessage("用户已新增");
    window.location.reload();
  }

  async function updateUser(userId: string) {
    const edit = edits[userId];
    if (!edit) return;

    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: edit.role,
        emailVerified: edit.emailVerified,
        password: edit.password,
        creditDelta: Number(edit.creditDelta || 0),
        creditNote: edit.creditNote
      })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || "保存用户失败");
      return;
    }

    setMessage("用户已更新");
    window.location.reload();
  }

  function setEdit(userId: string, patch: Partial<{ role: string; emailVerified: boolean; password: string; creditDelta: string; creditNote: string }>) {
    setEdits((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        ...patch
      }
    }));
  }

  return (
    <section className="panel admin-section" id="admin-users">
      <div className="section-title compact">
        <div>
          <h2>用户管理</h2>
          <p className="muted">新增用户、管理权限和手动调整积分。</p>
        </div>
      </div>

      <form className="admin-user-create" onSubmit={createUser}>
        <input className="input" type="email" placeholder="邮箱" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} />
        <input className="input" placeholder="昵称" value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} />
        <input className="input" type="password" placeholder="初始密码，至少 8 位" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} />
        <select className="select" value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}>
          <option value="USER">普通用户</option>
          <option value="ADMIN">管理员</option>
          <option value="SUPER_ADMIN">超级管理员</option>
        </select>
        <input className="input" type="number" min="0" step="1" placeholder="初始积分" value={newUser.initialCredits} onChange={(event) => setNewUser({ ...newUser, initialCredits: event.target.value })} />
        <label className="checkbox-line">
          <input type="checkbox" checked={newUser.emailVerified} onChange={(event) => setNewUser({ ...newUser, emailVerified: event.target.checked })} />
          邮箱已验证
        </label>
        <button className="button button-primary" disabled={loading}>新增用户</button>
      </form>

      {message ? <p className="notice">{message}</p> : null}

      <div className="admin-user-list">
        {users.map((user) => {
          const edit = edits[user.id] ?? {
            role: user.role,
            emailVerified: Boolean(user.emailVerified),
            password: "",
            creditDelta: "",
            creditNote: ""
          };

          return (
            <article className="admin-user-row" key={user.id}>
              <div className="admin-user-main">
                <strong>{user.email}</strong>
                <span>{user.name || "未填写昵称"} · 当前 {user.balance.toFixed(0)} 积分 · {formatDate(user.createdAt)}</span>
              </div>
              <select className="select" value={edit.role} onChange={(event) => setEdit(user.id, { role: event.target.value })}>
                <option value="USER">普通用户</option>
                <option value="ADMIN">管理员</option>
                <option value="SUPER_ADMIN">超级管理员</option>
              </select>
              <label className="checkbox-line compact-checkbox">
                <input type="checkbox" checked={edit.emailVerified} onChange={(event) => setEdit(user.id, { emailVerified: event.target.checked })} />
                已验证
              </label>
              <input className="input" type="password" placeholder="新密码" value={edit.password} onChange={(event) => setEdit(user.id, { password: event.target.value })} />
              <input className="input" type="number" step="1" placeholder="+100 或 -10" value={edit.creditDelta} onChange={(event) => setEdit(user.id, { creditDelta: event.target.value })} />
              <input className="input" placeholder="积分备注" value={edit.creditNote} onChange={(event) => setEdit(user.id, { creditNote: event.target.value })} />
              <button className="button button-secondary" disabled={loading} onClick={() => updateUser(user.id)}>保存</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("zh-CN");
}
