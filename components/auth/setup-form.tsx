import { KeyRound, UserRound } from "lucide-react";
import { AuthFormCard, type AuthFormField } from "./auth-form-card";

export function SetupForm() {
  return (
    <AuthFormCard
      description="首次部署时创建本地管理员账号。"
      endpoint="/api/auth/setup"
      fields={setupFields}
      pendingLabel="正在创建"
      submitLabel="创建并进入"
      title="创建管理员"
    />
  );
}

const setupFields: AuthFormField[] = [
  {
    label: "用户名",
    leadingIcon: <UserRound aria-hidden size={16} />,
    name: "username",
    placeholder: "admin",
    required: true
  },
  {
    label: "显示名",
    name: "displayName",
    placeholder: "家庭管理员"
  },
  {
    label: "密码",
    leadingIcon: <KeyRound aria-hidden size={16} />,
    minLength: 8,
    name: "password",
    placeholder: "至少 8 位",
    required: true,
    type: "password"
  }
];
